
import { createHash, randomUUID } from "node:crypto";
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

async function getUserLogInfo(db, userId) {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new Error("User yang melakukan aksi tidak valid");
  }

  const user = await db.user.findUnique({
    where: { id: parsedUserId },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User yang melakukan aksi tidak ditemukan");
  }

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
}

function generatePurchaseNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `PO-${timestamp}-${random}`;
}

function validateItems(items) {
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
      throw new Error(
        "Jumlah pembelian harus berupa bilangan bulat positif"
      );
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
}

function createPurchasePayload(data, supplierId, items) {
  return {
    supplierId,
    purchaseDate: data.purchaseDate
      ? new Date(data.purchaseDate).toISOString()
      : null,
    note: data.note?.trim() || null,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
    })),
  };
}

function createPayloadHash(payload) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function findExistingIdempotentPurchase(key) {
  return prisma.purchaseIdempotency.findUnique({
    where: { key },
    include: {
      purchase: {
        include: purchaseInclude,
      },
    },
  });
}

function validateExistingIdempotency(record, payloadHash) {
  if (record.payloadHash !== payloadHash) {
    const error = new Error(
      "Idempotency key sudah digunakan untuk data pembelian yang berbeda"
    );

    error.statusCode = 409;
    throw error;
  }

  if (!record.purchase) {
    const error = new Error(
      "Key sudah digunakan, tetapi data pembelian tidak tersedia"
    );

    error.statusCode = 409;
    throw error;
  }

  return record.purchase;
}

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
    const normalizedStatus = status.toUpperCase();
    const allowedStatuses = [
      "PENDING",
      "RECEIVED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new Error("Status pembelian tidak valid");
    }

    where.status = normalizedStatus;
  }

  const [purchases, total] = await Promise.all([
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
    where: { id: purchaseId },
    include: purchaseInclude,
  });

  if (!purchase) {
    throw new Error("Data pembelian tidak ditemukan");
  }

  return purchase;
}

export async function createPurchaseService(
  data,
  idempotencyKey,
  userId
) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  let key = null;
  let payloadHash = null;
  let actor = {
    userId: Number(userId) || null,
  };

  try {
    actor = await getUserLogInfo(prisma, userId);

    if (
      typeof idempotencyKey !== "string" ||
      !idempotencyKey.trim() ||
      idempotencyKey.trim().length > 255
    ) {
      throw new Error("Idempotency key tidak valid");
    }

    key = idempotencyKey.trim();

    const supplierId = Number(data.supplierId);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new Error("Supplier wajib dipilih");
    }

    const items = validateItems(data.items);

    const purchaseDate = data.purchaseDate
      ? new Date(data.purchaseDate)
      : new Date();

    if (Number.isNaN(purchaseDate.getTime())) {
      throw new Error("Tanggal pembelian tidak valid");
    }

    const payload = createPurchasePayload(
      data,
      supplierId,
      items
    );

    payloadHash = createPayloadHash(payload);

    const existingRequest =
      await findExistingIdempotentPurchase(key);

    if (existingRequest) {
      const existingPurchase = validateExistingIdempotency(
        existingRequest,
        payloadHash
      );

      return existingPurchase;
    }

    const totalAmount = items.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    const purchase = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true },
      });

      if (!supplier) {
        throw new Error("Supplier tidak ditemukan");
      }

      const productIds = [
        ...new Set(items.map((item) => item.productId)),
      ];

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      if (products.length !== productIds.length) {
        throw new Error("Satu atau lebih produk tidak ditemukan");
      }

      const createdPurchase = await tx.purchase.create({
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

      await tx.purchaseIdempotency.create({
        data: {
          key,
          payloadHash,
          purchaseId: createdPurchase.id,
        },
      });

      return createdPurchase;
    });

    console.log("[CREATE PURCHASE] Pembelian berhasil dibuat", {
      requestId,
      idempotencyKey: key,
      ...actor,
      purchaseId: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      supplierId: purchase.supplierId,
      totalAmount: String(purchase.totalAmount),
      totalItems: purchase.items.length,
      durationMs: Date.now() - startedAt,
    });

    return purchase;
  } catch (error) {
    if (error.code === "P2002" && key && payloadHash) {
      try {
        const existingRequest =
          await findExistingIdempotentPurchase(key);

        if (existingRequest) {
          const existingPurchase = validateExistingIdempotency(
            existingRequest,
            payloadHash
          );

          console.log(
            "[CREATE PURCHASE] Request bersamaan berhasil ditangani",
            {
              requestId,
              idempotencyKey: key,
              ...actor,
              purchaseId: existingPurchase.id,
              purchaseNumber: existingPurchase.purchaseNumber,
              durationMs: Date.now() - startedAt,
            }
          );

          return existingPurchase;
        }
      } catch (duplicateError) {
        if (duplicateError.statusCode === 409) {
          error = duplicateError;
        } else if (duplicateError.code !== "P2002") {
          error = duplicateError;
        }
      }
    }

    console.error("[CREATE PURCHASE] Gagal membuat pembelian", {
      requestId,
      idempotencyKey: key || idempotencyKey || null,
      ...actor,
      error: error.message,
      errorCode: error.code || null,
      durationMs: Date.now() - startedAt,
    });

    throw error;
  }
}

export async function receivePurchaseService(id, userId) {
  const purchaseId = Number(id);
  const requestId = randomUUID();
  const startedAt = Date.now();

  let actor = {
    userId: Number(userId) || null,
  };

  try {
    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
      throw new Error("ID pembelian tidak valid");
    }

    actor = await getUserLogInfo(prisma, userId);

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: {
          items: {
            orderBy: { id: "asc" },
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

      if (statusUpdate.count !== 1) {
        throw new Error(
          "Pembelian sudah diproses oleh pengguna lain"
        );
      }

      const stockChanges = [];

      for (const item of purchase.items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
          select: {
            id: true,
            name: true,
            stock: true,
          },
        });

        const stockAfter = updatedProduct.stock;
        const stockBefore = stockAfter - item.quantity;

        await tx.stockMovement.create({
          data: {
            type: "IN",
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            note: "Pembelian berhasil diterima",
            productId: item.productId,
            userId: actor.userId,
            purchaseId: purchase.id,
          },
        });

        stockChanges.push({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          quantityAdded: item.quantity,
          stockBefore,
          stockAfter,
        });
      }

      const updatedPurchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: purchaseInclude,
      });

      return {
        purchase: updatedPurchase,
        stockChanges,
      };
    });

    console.log("[ACCEPT PURCHASE] Pembelian berhasil diterima", {
      requestId,
      ...actor,
      purchaseId: result.purchase.id,
      purchaseNumber: result.purchase.purchaseNumber,
      Status: "RECEIVED",
      stockChanges: result.stockChanges,
      durationMs: Date.now() - startedAt,
    });

    return result.purchase;
  } catch (error) {
    console.error("[ACCEPT PURCHASE] Gagal menerima pembelian", {
      requestId,
      purchaseId,
      ...actor,
      error: error.message,
      errorCode: error.code || null,
      durationMs: Date.now() - startedAt,
    });

    throw error;
  }
}

export async function cancelPurchaseService(
  id,
  data = {},
  userId
) {
  const purchaseId = Number(id);
  const reason = String(data.reason || "").trim();
  const requestId = randomUUID();
  const startedAt = Date.now();

  let actor = {
    userId: Number(userId) || null,
  };

  try {
    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
      throw new Error("ID pembelian tidak valid");
    }

    if (!reason) {
      throw new Error("Alasan pembatalan wajib diisi");
    }

    actor = await getUserLogInfo(prisma, userId);

    const purchase = await prisma.$transaction(async (tx) => {
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

      if (result.count !== 1) {
        const existingPurchase = await tx.purchase.findUnique({
          where: { id: purchaseId },
          select: {
            id: true,
            status: true,
          },
        });

        if (!existingPurchase) {
          throw new Error("Data pembelian tidak ditemukan");
        }

        throw new Error(
          `Pembelian tidak dapat ditolak karena statusnya ${existingPurchase.status}`
        );
      }

      return tx.purchase.findUnique({
        where: { id: purchaseId },
        include: purchaseInclude,
      });
    });

    console.log("[REJECT PURCHASE] Pembelian berhasil ditolak", {
      requestId,
      ...actor,
      purchaseId: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      Status: "CANCELLED",
      reason,
      durationMs: Date.now() - startedAt,
    });

    return purchase;
  } catch (error) {
    console.error("[REJECT PURCHASE] Gagal menolak pembelian", {
      requestId,
      purchaseId,
      ...actor,
      reason,
      error: error.message,
      errorCode: error.code || null,
      durationMs: Date.now() - startedAt,
    });

    throw error;
  }
}

export async function deletePurchaseService(id) {
  const purchaseId = Number(id);

  if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
    throw new Error("ID pembelian tidak valid");
  }

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
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
      where: { purchaseId },
    });

    return tx.purchase.delete({
      where: { id: purchaseId },
    });
  });
}
