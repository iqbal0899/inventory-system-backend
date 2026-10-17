import { prisma } from "../config/database.js";

async function validateSupplier(supplierId) {
  if (
    supplierId === undefined ||
    supplierId === null ||
    supplierId === ""
  ) {
    return null;
  }

  const parsedSupplierId = Number(supplierId);

  if (
    !Number.isInteger(parsedSupplierId) ||
    parsedSupplierId <= 0
  ) {
    throw new Error("Supplier tidak valid");
  }

  const supplier = await prisma.supplier.findUnique({
    where: {
      id: parsedSupplierId,
    },
  });

  if (!supplier) {
    throw new Error("Supplier yang dipilih tidak ditemukan");
  }

  return parsedSupplierId;
}

function validateProductNumbers(data) {
  const price = Number(data.price);
  const stock = Number(data.stock ?? 0);
  const minStock = Number(data.minStock ?? 0);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Harga produk tidak valid");
  }

  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new Error("Stok produk tidak valid");
  }

  if (!Number.isSafeInteger(minStock) || minStock < 0) {
    throw new Error("Minimum stok tidak valid");
  }

  return {
    price,
    stock,
    minStock,
  };
}

function normalizeStatus(status) {
  const normalizedStatus = status ?? "ACTIVE";

  if (
    normalizedStatus !== "ACTIVE" &&
    normalizedStatus !== "INACTIVE"
  ) {
    throw new Error("Status produk tidak valid");
  }

  return normalizedStatus;
}

function getCategory(data) {
  const value =
    data.category !== undefined
      ? data.category
      : data.categoryId;

  if (value === undefined || value === null) {
    return null;
  }

  const category = String(value).trim();

  return category || null;
}

export async function createProductService(data) {
  return prisma.$transaction(async (tx) => {
    const name = data.name?.trim();

    if (!name) {
      throw new Error("Nama produk wajib diisi");
    }

    const supplierId = await validateSupplier(
      data.supplierId
    );

    const { price, stock, minStock } =
      validateProductNumbers(data);

    const status = normalizeStatus(data.status);

    const createdProduct = await tx.product.create({
      data: {
        code: `TEMP-${Date.now()}`,
        name,
        description: data.description?.trim() || null,
        category: getCategory(data),
        image: data.image || null,
        price,
        stock,
        minStock,
        unit: data.unit?.trim() || "pcs",
        status,
        supplierId,
      },
    });

    const code = `PRD-${String(
      createdProduct.id
    ).padStart(6, "0")}`;

    return tx.product.update({
      where: {
        id: createdProduct.id,
      },
      data: {
        code,
      },
      include: {
        supplier: true,
      },
    });
  });
}


export async function getProductsService() {
  return prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      supplier: true,
    },
  });
}

export async function getProductByIdService(id) {
  return prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      supplier: true,
    },
  });
}

export async function updateProductService(id, data) {
  return prisma.$transaction(async (tx) => {
    const existingProduct = await tx.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      return null;
    }

    const updateData = {};

    if (data.name !== undefined) {
      const name = data.name.trim();

      if (!name) {
        throw new Error("Nama produk wajib diisi");
      }

      updateData.name = name;
    }

    if (data.description !== undefined) {
      updateData.description =
        data.description?.trim() || null;
    }

    if (
      data.category !== undefined ||
      data.categoryId !== undefined
    ) {
      updateData.category = getCategory(data);
    }

    if (data.image !== undefined) {
      updateData.image = data.image || null;
    }

    if (data.price !== undefined) {
      const price = Number(data.price);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Harga produk tidak valid");
      }

      updateData.price = price;
    }

    if (data.stock !== undefined) {
      const stock = Number(data.stock);

      if (!Number.isSafeInteger(stock) || stock < 0) {
        throw new Error("Stok produk tidak valid");
      }

      updateData.stock = stock;
    }

    if (data.minStock !== undefined) {
      const minStock = Number(data.minStock);

      if (
        !Number.isSafeInteger(minStock) ||
        minStock < 0
      ) {
        throw new Error("Minimum stok tidak valid");
      }

      updateData.minStock = minStock;
    }

    if (data.unit !== undefined) {
      updateData.unit = data.unit.trim() || "pcs";
    }

    if (data.status !== undefined) {
      updateData.status = normalizeStatus(data.status);
    }

    if (data.supplierId !== undefined) {
      updateData.supplierId = await validateSupplier(
        data.supplierId
      );
    }

    return tx.product.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        supplier: true,
      },
    });
  });
}

export async function deleteProductService(id) {
  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    return null;
  }

  if (existingProduct.status === "INACTIVE") {
    return existingProduct;
  }

  return prisma.product.update({
    where: {
      id,
    },
    data: {
      status: "INACTIVE",
    },
    include: {
      supplier: true,
    },
  });
}

export async function restoreProductService(id) {
  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    return null;
  }

  if (existingProduct.status === "ACTIVE") {
    return existingProduct;
  }

  return prisma.product.update({
    where: {
      id,
    },
    data: {
      status: "ACTIVE",
    },
    include: {
      supplier: true,
    },
  });
}

export async function getInactiveProductsService() {
  return prisma.product.findMany({
    where: {
      status: "INACTIVE",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      supplier: true,
    },
  });
}

export async function getNextProductCodeService() {
  const lastProduct = await prisma.product.findFirst({
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
    },
  });

  const nextId = (lastProduct?.id || 0) + 1;

  return `PRD-${String(nextId).padStart(6, "0")}`;
}
