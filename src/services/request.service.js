import { prisma } from "../config/database.js";

export async function getRequestsService(params = {}) {
  const page = Math.max(
    Number(params.page) || 1,
    1
  );

  const limit = Math.min(
    Math.max(Number(params.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;

  const where = {};

  if (params.status) {
    where.status = params.status.toUpperCase();
  }

  const [requests, total] =
    await prisma.$transaction([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          supplier: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  stock: true,
                  unit: true,
                  status: true,
                },
              },
            },
          },
        },
      }),

      prisma.request.count({
        where,
      }),
    ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRequestByIdService(id) {
  const request =
    await prisma.request.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                stock: true,
                minStock: true,
                unit: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (!request) {
    throw new Error(
      "Request tidak ditemukan"
    );
  }

  return request;
}

function generateRequestNumber() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const time = String(
    Date.now()
  ).slice(-6);

  return `REQ-${year}${month}${day}-${time}`;
}

export async function createRequestService({
  items,
  note,
  requesterId,
}) {
  if (!requesterId) {
    throw new Error(
      "User pembuat request tidak ditemukan"
    );
  }

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "Request harus memiliki minimal satu produk"
    );
  }

  const productIds = items.map(
    (item) => Number(item.productId)
  );

  const uniqueProductIds = [
    ...new Set(productIds),
  ];

  if (
    uniqueProductIds.length !==
    productIds.length
  ) {
    throw new Error(
      "Produk yang sama tidak boleh ditambahkan lebih dari satu kali"
    );
  }

  const products =
    await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        stock: true,
        unit: true,
      },
    });

  if (
    products.length !==
    productIds.length
  ) {
    throw new Error(
      "Salah satu produk tidak ditemukan atau tidak aktif"
    );
  }

  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ])
  );

  for (const item of items) {
    const product =
      productMap.get(
        Number(item.productId)
      );

    if (!product) {
      throw new Error(
        `Produk dengan ID ${item.productId} tidak ditemukan`
      );
    }

    if (
      !Number.isInteger(
        Number(item.quantity)
      ) ||
      Number(item.quantity) <= 0
    ) {
      throw new Error(
        `Jumlah request untuk produk ${product.name} harus lebih dari 0`
      );
    }
  }

  const request =
    await prisma.request.create({
      data: {
        requestNumber:
          generateRequestNumber(),

        createdById:
          Number(requesterId),

        note:
          note?.trim() || null,

        status: "PENDING",

        items: {
          create: items.map(
            (item) => ({
              productId:
                Number(
                  item.productId
                ),
              quantity:
                Number(
                  item.quantity
                ),
            })
          ),
        },
      },

      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },

        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                stock: true,
                unit: true,
              },
            },
          },
        },
      },
    });

  return request;
}

export async function approveRequestService(
  id,
  approvedById
) {
  if (!approvedById) {
    throw new Error(
      "User yang menyetujui request tidak ditemukan"
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const request =
        await tx.request.findUnique({
          where: {
            id,
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    stock: true,
                    unit: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

      if (!request) {
        throw new Error(
          "Request tidak ditemukan"
        );
      }

      if (
        request.status !== "PENDING"
      ) {
        throw new Error(
          "Request hanya dapat disetujui ketika status masih pending"
        );
      }

      if (
        !request.items ||
        request.items.length === 0
      ) {
        throw new Error(
          "Request tidak memiliki produk"
        );
      }

      for (const item of request.items) {
        const product =
          item.product;

        if (!product) {
          throw new Error(
            `Produk dengan ID ${item.productId} tidak ditemukan`
          );
        }

        if (
          product.status !== "ACTIVE"
        ) {
          throw new Error(
            `Produk ${product.name} tidak aktif`
          );
        }

        if (
          product.stock <
          item.quantity
        ) {
          throw new Error(
            `Stok ${product.name} tidak mencukupi. Stok tersedia ${product.stock} ${product.unit}, request ${item.quantity} ${product.unit}`
          );
        }
      }

      for (const item of request.items) {
        const product =
          await tx.product.findUnique({
            where: {
              id: item.productId,
            },
            select: {
              id: true,
              name: true,
              stock: true,
              unit: true,
              status: true,
            },
          });

        if (!product) {
          throw new Error(
            `Produk ${item.productId} tidak ditemukan`
          );
        }

        if (
          product.status !== "ACTIVE"
        ) {
          throw new Error(
            `Produk ${product.name} tidak aktif`
          );
        }

        const stockBefore =
          product.stock;

        const updatedProduct =
          await tx.product.updateMany({
            where: {
              id: item.productId,
              status: "ACTIVE",
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement:
                  item.quantity,
              },
            },
          });

        if (
          updatedProduct.count !== 1
        ) {
          throw new Error(
            `Stok ${product.name} tidak mencukupi`
          );
        }

        const stockAfter =
          stockBefore -
          item.quantity;

        await tx.stockMovement.create({
          data: {
            type: "OUT",

            quantity:
              -item.quantity,

            stockBefore,

            stockAfter,

            note: "Request disetujui",

            productId:
              item.productId,

            userId:
              Number(approvedById),

            requestId:
              request.id,
          },
        });
      }

      const approvedRequest =
        await tx.request.update({
          where: {
            id,
          },
          data: {
            status: "APPROVED",

            approvedById:
              Number(approvedById),

            approvedAt:
              new Date(),
          },

          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },

            approvedBy: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },

            supplier: true,

            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    stock: true,
                    unit: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

      return approvedRequest;
    }
  );
}

export async function rejectRequestService(
  id,
  reason,
  rejectedById
) {
  const request =
    await prisma.request.findUnique({
      where: {
        id,
      },
    });

  if (!request) {
    throw new Error(
      "Request tidak ditemukan"
    );
  }

  if (
    request.status !== "PENDING"
  ) {
    throw new Error(
      "Request hanya dapat ditolak ketika status masih pending"
    );
  }

  const note =
    reason?.trim()
      ? `Request ditolak: ${reason.trim()}`
      : "Request ditolak";

  return prisma.request.update({
    where: {
      id,
    },

    data: {
      status: "REJECTED",
      note,
    },

    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },

      approvedBy: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },

      items: {
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              stock: true,
              unit: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteRequestService(
  id
) {
  const request =
    await prisma.request.findUnique({
      where: {
        id,
      },
    });

  if (!request) {
    throw new Error(
      "Request tidak ditemukan"
    );
  }

  if (
    request.status !== "PENDING"
  ) {
    throw new Error(
      "Request yang sudah diproses tidak dapat dihapus"
    );
  }

  return prisma.request.delete({
    where: {
      id,
    },
  });
}