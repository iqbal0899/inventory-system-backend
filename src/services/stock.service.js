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

export async function getStockByProductIdService(
  productId
) {
  return prisma.product.findUnique({
    where: {
      id: productId,
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
        },
      },
    },
  });
}

export async function stockInService(
  productId,
  quantity,
  note,
  userId
) {
  return prisma.$transaction(async (tx) => {
    const product =
      await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan"
      );
    }

    if (product.status !== "ACTIVE") {
      throw new Error(
        "Produk tidak aktif. Aktifkan produk terlebih dahulu."
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Jumlah stok harus lebih dari 0"
      );
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new Error(
        "User tidak valid"
      );
    }

    const user =
      await tx.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new Error(
        "User tidak ditemukan"
      );
    }

    const stockBefore =
      product.stock;

    const stockAfter =
      stockBefore + quantity;

    const updatedProduct =
      await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          stock: stockAfter,
        },
        include: {
          supplier: true,
        },
      });

    await tx.stockMovement.create({
      data: {
        type: "IN",
        quantity,
        stockBefore,
        stockAfter,
        note: note || null,
        productId,
        userId,
      },
    });

    return updatedProduct;
  });
}

export async function stockOutService(
  productId,
  quantity,
  note,
  userId
) {
  return prisma.$transaction(async (tx) => {
    const product =
      await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan"
      );
    }

    if (product.status !== "ACTIVE") {
      throw new Error(
        "Produk tidak aktif. Aktifkan produk terlebih dahulu."
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Jumlah stok harus lebih dari 0"
      );
    }

    if (
      product.stock < quantity
    ) {
      throw new Error(
        "Stok tidak mencukupi"
      );
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new Error(
        "User tidak valid"
      );
    }

    const user =
      await tx.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new Error(
        "User tidak ditemukan"
      );
    }

    const stockBefore =
      product.stock;

    const stockAfter =
      stockBefore - quantity;

    const updatedProduct =
      await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          stock: stockAfter,
        },
        include: {
          supplier: true,
        },
      });

    await tx.stockMovement.create({
      data: {
        type: "OUT",
        quantity,
        stockBefore,
        stockAfter,
        note: note || null,
        productId,
        userId,
      },
    });

    return updatedProduct;
  });
}

export async function adjustStockService(
  productId,
  stock,
  note,
  userId
) {
  return prisma.$transaction(async (tx) => {
    const product =
      await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan"
      );
    }

    if (product.status !== "ACTIVE") {
      throw new Error(
        "Produk tidak aktif. Aktifkan produk terlebih dahulu."
      );
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      throw new Error(
        "Stok tidak valid"
      );
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new Error(
        "User tidak valid"
      );
    }

    const user =
      await tx.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new Error(
        "User tidak ditemukan"
      );
    }

    const stockBefore =
      product.stock;

    const stockAfter = stock;

    const updatedProduct =
      await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          stock: stockAfter,
        },
        include: {
          supplier: true,
        },
      });

    await tx.stockMovement.create({
      data: {
        type: "ADJUSTMENT",
        quantity:
          stockAfter - stockBefore,
        stockBefore,
        stockAfter,
        note: note || null,
        productId,
        userId,
      },
    });

    return updatedProduct;
  });
}

export async function getStockMovementsService(
  productId
) {
  return prisma.stockMovement.findMany({
    where: {
      productId,
    },
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
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}