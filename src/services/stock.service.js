import { prisma } from "../config/database.js";

export async function getStocksService() {
  return prisma.product.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      supplier: true,
    },
  });
}

export async function getStockByProductIdService(productId) {
  const product = await prisma.product.findUnique({
    where: {
      id: Number(productId),
    },
    include: {
      supplier: true,
      stockMovements: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          request: {
            select: {
              id: true,
              requestNumber: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error("Produk tidak ditemukan");
  }

  return product;
}
export async function getStockMovementsService(params = {}) {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(params.limit) || 10, 1),
    1000
  );
  const skip = (page - 1) * limit;

  const { startDate, endDate, productId, type } = params;

  if ((startDate && !endDate) || (!startDate && endDate)) {
    throw new Error("Tanggal mulai dan tanggal akhir wajib diisi");
  }

  let dateFilter;

  if (startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00.000`);
    const end = new Date(`${endDate}T23:59:59.999`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new Error("Format tanggal tidak valid");
    }

    if (start > end) {
      throw new Error(
        "Tanggal mulai tidak boleh melebihi tanggal akhir"
      );
    }

    dateFilter = {
      gte: start,
      lte: end,
    };
  }

  const where = {
    ...(type ? { type } : {}),
    ...(productId ? { productId: Number(productId) } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          include: {
            supplier: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        request: {
          select: {
            id: true,
            requestNumber: true,
            createdBy: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        purchase: {
          select: {
            id: true,
            purchaseNumber: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  let stockAddedMap = new Map();

  if (dateFilter) {
    const incomingMovements = await prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        type: "IN",
        createdAt: dateFilter,
      },
      _sum: {
        quantity: true,
      },
    });

    stockAddedMap = new Map(
      incomingMovements.map((movement) => [
        movement.productId,
        movement._sum.quantity ?? 0,
      ])
    );
  }

const data = movements.map((movement) => {
  const request = movement.request;
  const purchase = movement.purchase;

  return {
    id: movement.id,
    productId: movement.productId,
    code: movement.product?.code ?? "-",
    name: movement.product?.name ?? "-",
    product: movement.product?.name ?? "-",
    supplier: movement.product?.supplier?.name ?? "-",
    price: Number(movement.product?.price ?? 0),
    type: movement.type,
    quantity: movement.quantity,
    stockBefore: movement.stockBefore,
    stockAdded:
      movement.type === "OUT"
        ? stockAddedMap.get(movement.productId) ?? 0
        : movement.type === "IN"
          ? movement.quantity
          : 0,
    stockReduced:
      movement.type === "OUT"
        ? Math.abs(movement.quantity)
        : 0,
    stockAfter: movement.stockAfter,
    currentStock: movement.product?.stock ?? 0,
    date: movement.createdAt,
    createdAt: movement.createdAt,
    user: movement.user?.username ?? "-",
    username: movement.user?.username ?? "-",
    requestNumber: request?.requestNumber ?? "-",
    purchaseNumber: purchase?.purchaseNumber ?? "-",
    note: movement.note ?? "-",
  };
});

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


export async function stockInService({
  productId,
  quantity,
  note,
  userId,
}) {
  return prisma.$transaction(async (tx) => {
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error("Jumlah stok masuk harus bilangan bulat positif");
    }

    const product = await tx.product.findUnique({
      where: {
        id: parsedProductId,
      },
    });

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    const stockBefore = product.stock;
    const stockAfter = stockBefore + parsedQuantity;

    const updatedProduct = await tx.product.update({
      where: {
        id: parsedProductId,
      },
      data: {
        stock: stockAfter,
      },
    });

    await tx.stockMovement.create({
  data: {
    type: "IN",
    quantity: item.quantity,
    stockBefore,
    stockAfter,
    note: note || null,
    productId: item.productId,
    userId: Number(userId),
    purchaseId: purchase.id,
  },
});

    return updatedProduct;
  });
}

export async function stockOutService({
  productId,
  quantity,
  note,
  userId,
}) {
  return prisma.$transaction(async (tx) => {
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error("Jumlah stok keluar harus bilangan bulat positif");
    }

    const product = await tx.product.findUnique({
      where: {
        id: parsedProductId,
      },
    });

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    if (parsedQuantity > product.stock) {
      throw new Error("Stok tidak mencukupi");
    }

    const stockBefore = product.stock;
    const stockAfter = stockBefore - parsedQuantity;

    const updatedProduct = await tx.product.update({
      where: {
        id: parsedProductId,
      },
      data: {
        stock: stockAfter,
      },
    });

    await tx.stockMovement.create({
      data: {
        type: "OUT",
        quantity: parsedQuantity,
        stockBefore,
        stockAfter,
        note: note || null,
        productId: parsedProductId,
        userId: Number(userId),
      },
    });

    return updatedProduct;
  });
}

export async function adjustStockService({
  productId,
  stock,
  note,
  userId,
}) {
  return prisma.$transaction(async (tx) => {
    const parsedProductId = Number(productId);
    const stockAfter = Number(stock);

    if (!Number.isInteger(stockAfter) || stockAfter < 0) {
      throw new Error("Stok harus berupa bilangan bulat dan tidak boleh negatif");
    }

    const product = await tx.product.findUnique({
      where: {
        id: parsedProductId,
      },
    });

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    const stockBefore = product.stock;
    const quantity = stockAfter - stockBefore;

    const updatedProduct = await tx.product.update({
      where: {
        id: parsedProductId,
      },
      data: {
        stock: stockAfter,
      },
    });

    await tx.stockMovement.create({
      data: {
        type: "ADJUSTMENT",
        quantity,
        stockBefore,
        stockAfter,
        note: note || null,
        productId: parsedProductId,
        userId: Number(userId),
      },
    });

    return updatedProduct;
  });
}
