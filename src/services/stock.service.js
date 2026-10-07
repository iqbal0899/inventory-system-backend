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

export async function getStockMovementsService({
  page = 1,
  limit = 10,
  productId,
  type,
} = {}) {
  const currentPage = Math.max(
    1,
    Number(page) || 1
  );

  const perPage = Math.min(
    100,
    Math.max(1, Number(limit) || 10)
  );

  const where = {};

  if (productId) {
    const parsedProductId = Number(productId);

    if (
      Number.isInteger(parsedProductId) &&
      parsedProductId > 0
    ) {
      where.productId = parsedProductId;
    }
  }

  if (type) {
    const validTypes = [
      "INITIAL",
      "IN",
      "OUT",
      "ADJUSTMENT",
    ];

    if (validTypes.includes(type)) {
      where.type = type;
    }
  }

  const skip = (currentPage - 1) * perPage;

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: perPage,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
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
          },
        },
      },
    }),

    prisma.stockMovement.count({
      where,
    }),
  ]);

  return {
    data: movements,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / perPage)
      ),
    },
  };
}

export async function stockInService({
  productId,
  quantity,
  note,
  userId,
}) {
  const result = await prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: Number(productId),
        },
      });

      if (!product) {
        throw new Error(
          "Produk tidak ditemukan"
        );
      }

      const stockBefore = product.stock;
      const stockAfter =
        stockBefore + Number(quantity);

      const updatedProduct =
        await tx.product.update({
          where: {
            id: Number(productId),
          },
          data: {
            stock: stockAfter,
          },
        });

      await tx.stockMovement.create({
        data: {
          type: "IN",
          quantity: Number(quantity),
          stockBefore,
          stockAfter,
          note: note || null,
          productId: Number(productId),
          userId: Number(userId),
        },
      });

      return updatedProduct;
    }
  );

  return result;
}

export async function stockOutService({
  productId,
  quantity,
  note,
  userId,
}) {
  const result = await prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: Number(productId),
        },
      });

      if (!product) {
        throw new Error(
          "Produk tidak ditemukan"
        );
      }

      const parsedQuantity = Number(quantity);

      if (parsedQuantity > product.stock) {
        throw new Error(
          "Stok tidak mencukupi"
        );
      }

      const stockBefore = product.stock;
      const stockAfter =
        stockBefore - parsedQuantity;

      const updatedProduct =
        await tx.product.update({
          where: {
            id: Number(productId),
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
          productId: Number(productId),
          userId: Number(userId),
        },
      });

      return updatedProduct;
    }
  );

  return result;
}

export async function adjustStockService({
  productId,
  stock,
  note,
  userId,
}) {
  const result = await prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: Number(productId),
        },
      });

      if (!product) {
        throw new Error(
          "Produk tidak ditemukan"
        );
      }

      const stockBefore = product.stock;
      const stockAfter = Number(stock);
      const quantity =
        stockAfter - stockBefore;

      const updatedProduct =
        await tx.product.update({
          where: {
            id: Number(productId),
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
          productId: Number(productId),
          userId: Number(userId),
        },
      });

      return updatedProduct;
    }
  );

  return result;
}