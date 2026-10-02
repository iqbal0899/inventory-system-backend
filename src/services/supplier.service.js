import { prisma } from "../config/database.js";

// ========================================
// GENERATE SUPPLIER CODE
// ========================================

async function generateSupplierCode() {
  const lastSupplier = await prisma.supplier.findFirst({
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
    },
  });

  const nextId = (lastSupplier?.id || 0) + 1;

  return `SUP-${String(nextId).padStart(6, "0")}`;
}

// ========================================
// CREATE SUPPLIER
// ========================================

export async function createSupplierService(data) {
  const name = data.name?.trim();

  if (!name) {
    throw new Error("Nama supplier wajib diisi");
  }

  const existingSupplier =
    await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

  if (existingSupplier) {
    throw new Error(
      "Supplier dengan nama tersebut sudah ada"
    );
  }

  const code = await generateSupplierCode();

  return prisma.supplier.create({
    data: {
      code,

      name,

      phone:
        data.phone?.trim() || null,

      email:
        data.email?.trim() || null,

      address:
        data.address?.trim() || null,
    },
  });
}

// ========================================
// GET ALL SUPPLIERS
// ========================================

export async function getSuppliersService() {
  return prisma.supplier.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ========================================
// GET SUPPLIER BY ID
// ========================================

export async function getSupplierByIdService(id) {
  return prisma.supplier.findUnique({
    where: {
      id,
    },

    include: {
      products: true,
    },
  });
}

// ========================================
// UPDATE SUPPLIER
// ========================================

export async function updateSupplierService(
  id,
  data
) {
  const existingSupplier =
    await prisma.supplier.findUnique({
      where: {
        id,
      },
    });

  if (!existingSupplier) {
    return null;
  }

  const name = data.name?.trim();

  if (!name) {
    throw new Error(
      "Nama supplier wajib diisi"
    );
  }

  const duplicateSupplier =
    await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },

        NOT: {
          id,
        },
      },
    });

  if (duplicateSupplier) {
    throw new Error(
      "Supplier dengan nama tersebut sudah ada"
    );
  }

  return prisma.supplier.update({
    where: {
      id,
    },

    data: {
      // Code tidak diubah saat edit
      code: existingSupplier.code,

      name,

      phone:
        data.phone !== undefined
          ? data.phone?.trim() || null
          : existingSupplier.phone,

      email:
        data.email !== undefined
          ? data.email?.trim() || null
          : existingSupplier.email,

      address:
        data.address !== undefined
          ? data.address?.trim() || null
          : existingSupplier.address,
    },
  });
}

// ========================================
// DELETE SUPPLIER
// ========================================

export async function deleteSupplierService(id) {
  const existingSupplier =
    await prisma.supplier.findUnique({
      where: {
        id,
      },

      include: {
        products: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!existingSupplier) {
    return null;
  }

  if (existingSupplier.products.length > 0) {
    throw new Error(
      "Supplier tidak dapat dihapus karena masih digunakan oleh produk"
    );
  }

  return prisma.supplier.delete({
    where: {
      id,
    },
  });
}

