import { prisma } from "../config/database.js";


const purchaseInclude = {
  supplier: true,
  items: {
    include: {
      product: {
        select: {
          id: true,
          code: true,
          name: true,
          image: true,
          category: true,
          unit: true,
          stock: true,
        },
      },
    },
  },
};


const generatePurchaseNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `PO-${timestamp}-${random}`;
};

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Minimal harus ada satu item pembelian");
  }

  return items.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("Produk tidak valid");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Jumlah pembelian harus berupa bilangan bulat positif");
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("Harga beli tidak valid");
    }

    return {
      productId,
      quantity,
      unitPrice,
      subtotal: quantity * unitPrice,
    };
  });
};

export async function getPurchasesService(params = {}) {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(params.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;
  const search = String(params.search || "").trim();
  const status = String(params.status || "").trim();

  const where = {};

  if (search) {
    where.OR = [
      {
        purchaseNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        supplier: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (status) {
    const allowedStatuses = ["PENDING", "RECEIVED", "CANCELLED"];

    if (!allowedStatuses.includes(status.toUpperCase())) {
      throw new Error("Status pembelian tidak valid");
    }

    where.status = status.toUpperCase();
  }

  const [purchases, total] = await prisma.$transaction([
    prisma.purchase.findMany({
      where,
      include: purchaseInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return {
    purchases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPurchaseByIdService(id) {
  const purchaseId = Number(id);

  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    throw new Error("ID pembelian tidak valid");
  }

  const purchase = await prisma.purchase.findUnique({
    where: {
      id: purchaseId,
    },
    include: purchaseInclude,
  });

  if (!purchase) {
    throw new Error("Data pembelian tidak ditemukan");
  }

  return purchase;
}

export async function createPurchaseService(data) {
  const supplierId = Number(data.supplierId);
  const items = validateItems(data.items);

  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    throw new Error("Supplier wajib dipilih");
  }

  const totalAmount = items.reduce(
    (total, item) => total + item.subtotal,
    0
  );

  const purchaseDate = data.purchaseDate
    ? new Date(data.purchaseDate)
    : new Date();

  if (Number.isNaN(purchaseDate.getTime())) {
    throw new Error("Tanggal pembelian tidak valid");
  }

  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier tidak ditemukan");
    }

    const productIds = [...new Set(items.map((item) => item.productId))];

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("Satu atau lebih produk tidak ditemukan");
    }

    return tx.purchase.create({
      data: {
        purchaseNumber: generatePurchaseNumber(),
        supplierId,
        purchaseDate,
        note: data.note?.trim() || null,
        status: "PENDING",
        totalAmount,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: purchaseInclude,
    });
  });
}



export async function receivePurchaseService(id, userId) {
  const purchaseId = Number(id);
  const parsedUserId = Number(userId);

  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    throw new Error("ID pembelian tidak valid");
  }

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new Error("User penerima pembelian tidak valid");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: parsedUserId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new Error("User penerima pembelian tidak ditemukan");
    }

    const purchase = await tx.purchase.findUnique({
      where: {
        id: purchaseId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new Error("Data pembelian tidak ditemukan");
    }

    if (purchase.status !== "PENDING") {
      throw new Error(
        `Pembelian tidak dapat diterima karena statusnya ${purchase.status}`
      );
    }

    const statusUpdate = await tx.purchase.updateMany({
      where: {
        id: purchaseId,
        status: "PENDING",
      },
      data: {
        status: "RECEIVED",
      },
    });

    if (statusUpdate.count === 0) {
      throw new Error(
        "Pembelian sudah diproses oleh pengguna lain"
      );
    }

    for (const item of purchase.items) {
      const product = await tx.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new Error(
          `Produk dengan ID ${item.productId} tidak ditemukan`
        );
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore + item.quantity;

      await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          product: {
            connect: {
              id: product.id,
            },
          },
          user: {
            connect: {
              id: parsedUserId,
            },
          },
          purchase: {
            connect: {
              id: purchase.id,
            },
          },
          type: "IN",
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          note: `Penerimaan pembelian`,
        },
      });
    }

    return tx.purchase.findUnique({
      where: {
        id: purchaseId,
      },
      include: purchaseInclude,
    });
  });
}



export async function cancelPurchaseService(id, data = {}) {
  const purchaseId = Number(id);
  const reason = String(data.reason || "").trim();

  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    throw new Error("ID pembelian tidak valid");
  }

  if (!reason) {
    throw new Error("Alasan pembatalan wajib diisi");
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.purchase.updateMany({
      where: {
        id: purchaseId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
      },
    });

    if (result.count === 0) {
      const purchase = await tx.purchase.findUnique({
        where: {
          id: purchaseId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!purchase) {
        throw new Error("Data pembelian tidak ditemukan");
      }

      throw new Error(
        `Pembelian tidak dapat dibatalkan karena statusnya ${purchase.status}`
      );
    }

    return tx.purchase.findUnique({
      where: {
        id: purchaseId,
      },
      include: purchaseInclude,
    });
  });
}

export async function deletePurchaseService(id) {
  const purchaseId = Number(id);

  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    throw new Error("ID pembelian tidak valid");
  }

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: {
        id: purchaseId,
      },
      include: {
        items: true,
      },
    });

    if (!purchase) {
      throw new Error("Data pembelian tidak ditemukan");
    }

    if (!["PENDING", "CANCELLED"].includes(purchase.status)) {
      throw new Error(
        "Pembelian yang sudah diterima tidak boleh dihapus"
      );
    }

    await tx.purchaseItem.deleteMany({
      where: {
        purchaseId,
      },
    });

    return tx.purchase.delete({
      where: {
        id: purchaseId,
      },
    });
  });
}