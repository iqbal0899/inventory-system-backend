import { prisma } from "../config/database.js";

// ==========================================
// CREATE PRODUCT
// ==========================================

export async function createProductService(data) {
  console.log(
    "========== CREATE PRODUCT SERVICE =========="
  );

  console.log("DATA:", data);

  const product = await prisma.$transaction(
    async (tx) => {
      // ==============================
      // VALIDASI SUPPLIER
      // ==============================

      let supplierId = null;

      if (
        data.supplierId !== undefined &&
        data.supplierId !== null &&
        data.supplierId !== ""
      ) {
        supplierId = Number(data.supplierId);

        if (
          !Number.isInteger(supplierId) ||
          supplierId <= 0
        ) {
          throw new Error("Supplier tidak valid");
        }

        const supplier =
          await tx.supplier.findUnique({
            where: {
              id: supplierId,
            },
          });

        if (!supplier) {
          throw new Error(
            "Supplier yang dipilih tidak ditemukan"
          );
        }
      }

      // ==============================
      // CREATE PRODUCT
      // ==============================

      const createdProduct =
        await tx.product.create({
          data: {
            // Kode sementara
            code: `TEMP-${Date.now()}`,

            name: data.name?.trim(),

            description:
              data.description?.trim() || null,

            // Kategori sekarang STRING
            category:
              data.category?.trim() || null,

            image:
              data.image || null,

            price:
              Number(data.price),

            stock:
              Number(data.stock ?? 0),

            minStock:
              Number(data.minStock ?? 0),

            unit:
              data.unit || "pcs",

            status:
              "ACTIVE",

            supplierId,
          },
        });

      console.log(
        "PRODUCT CREATED:",
        createdProduct
      );

      // ==============================
      // GENERATE PRODUCT CODE
      // ==============================

      const code =
        `PRD-${String(
          createdProduct.id
        ).padStart(6, "0")}`;

      // ==============================
      // UPDATE CODE
      // ==============================

      const updatedProduct =
        await tx.product.update({
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

      console.log(
        "PRODUCT FINAL:",
        updatedProduct
      );

      return updatedProduct;
    }
  );

  return product;
}

// ==========================================
// GET ACTIVE PRODUCTS
// ==========================================

export async function getProductsService() {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      supplier: true,
    },
  });
}

// ==========================================
// GET PRODUCT BY ID
// ==========================================

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

// ==========================================
// UPDATE PRODUCT
// ==========================================

export async function updateProductService(
  id,
  data
) {
  const existingProduct =
    await prisma.product.findUnique({
      where: {
        id,
      },
    });

  if (!existingProduct) {
    return null;
  }

  // ==============================
  // VALIDASI SUPPLIER
  // ==============================

  let supplierId =
    existingProduct.supplierId;

  if (data.supplierId !== undefined) {
    if (
      data.supplierId === null ||
      data.supplierId === ""
    ) {
      supplierId = null;
    } else {
      supplierId =
        Number(data.supplierId);

      if (
        !Number.isInteger(supplierId) ||
        supplierId <= 0
      ) {
        throw new Error(
          "Supplier tidak valid"
        );
      }

      const supplier =
        await prisma.supplier.findUnique({
          where: {
            id: supplierId,
          },
        });

      if (!supplier) {
        throw new Error(
          "Supplier yang dipilih tidak ditemukan"
        );
      }
    }
  }

  // ==============================
  // DATA UPDATE
  // ==============================

  const updateData = {
    name:
      data.name !== undefined
        ? data.name.trim()
        : existingProduct.name,

    description:
      data.description !== undefined
        ? data.description?.trim() || null
        : existingProduct.description,

    // Kategori sekarang STRING
    category:
      data.category !== undefined
        ? data.category?.trim() || null
        : existingProduct.category,

    image:
      data.image !== undefined
        ? data.image
        : existingProduct.image,

    price:
      data.price !== undefined
        ? Number(data.price)
        : existingProduct.price,

    stock:
      data.stock !== undefined
        ? Number(data.stock)
        : existingProduct.stock,

    minStock:
      data.minStock !== undefined
        ? Number(data.minStock)
        : existingProduct.minStock,

    unit:
      data.unit !== undefined
        ? data.unit
        : existingProduct.unit,

    supplierId,
  };

  // ==============================
  // VALIDASI ANGKA
  // ==============================

  if (
    Number.isNaN(updateData.price) ||
    updateData.price < 0
  ) {
    throw new Error(
      "Harga produk tidak valid"
    );
  }

  if (
    Number.isNaN(updateData.stock) ||
    updateData.stock < 0
  ) {
    throw new Error(
      "Stok produk tidak valid"
    );
  }

  if (
    Number.isNaN(updateData.minStock) ||
    updateData.minStock < 0
  ) {
    throw new Error(
      "Minimum stok tidak valid"
    );
  }

  // ==============================
  // UPDATE PRODUCT
  // ==============================

  return prisma.product.update({
    where: {
      id,
    },

    data: updateData,

    include: {
      supplier: true,
    },
  });
}

// ==========================================
// SOFT DELETE
// ACTIVE → INACTIVE
// ==========================================

export async function deleteProductService(id) {
  const existingProduct =
    await prisma.product.findUnique({
      where: {
        id,
      },
    });

  if (!existingProduct) {
    return null;
  }

  if (
    existingProduct.status === "INACTIVE"
  ) {
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

// ==========================================
// RESTORE
// INACTIVE → ACTIVE
// ==========================================

export async function restoreProductService(id) {
  const existingProduct =
    await prisma.product.findUnique({
      where: {
        id,
      },
    });

  if (!existingProduct) {
    return null;
  }

  if (
    existingProduct.status === "ACTIVE"
  ) {
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

// ==========================================
// GET INACTIVE PRODUCTS
// ==========================================

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

// ==========================================
// GET NEXT PRODUCT CODE
// ==========================================

export async function getNextProductCodeService() {
  const lastProduct =
    await prisma.product.findFirst({
      orderBy: {
        id: "desc",
      },

      select: {
        id: true,
      },
    });

  const nextId =
    (lastProduct?.id || 0) + 1;

  return `PRD-${String(
    nextId
  ).padStart(6, "0")}`;
}

