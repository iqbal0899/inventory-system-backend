import { prisma } from "../config/database.js";
import {
  sendRequestStatusNotification,
} from "./pos-notification.service.js";

export async function getRequestsService(params = {}) {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(params.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;
  const where = {};

  if (params.status) {
    where.status = params.status.toUpperCase();
  }

  try {
    const [requests, total] = await prisma.$transaction([
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
      prisma.request.count({ where }),
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
  } catch (error) {
    console.error("GET REQUESTS SERVICE ERROR:", error);
    throw error;
  }
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
async function notifyApprovedRequest(requestNumber) {
  try {
    await sendRequestStatusNotification({
      requestNumber,
      status: "APPROVED",
    });

    return {
      sent: true,
      message: "Notifikasi persetujuan berhasil dikirim",
    };
  } catch (error) {
    console.error("NOTIFICATION APPROVE ERROR:", error);

    return {
      sent: false,
      message:
        "Request disetujui, tetapi notifikasi POS belum terkirim",
    };
  }
}

export async function approveRequestService(id, approvedById) {
  if (!approvedById) {
    throw new Error(
      "User yang menyetujui request tidak ditemukan"
    );
  }

  const approvedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.request.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                price: true,
                category: true,
                image: true,
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
      throw new Error("Request tidak ditemukan");
    }

    if (request.status !== "PENDING") {
      throw new Error(
        "Request hanya dapat disetujui ketika status masih pending"
      );
    }

    if (!request.items?.length) {
      throw new Error("Request tidak memiliki produk");
    }

    for (const item of request.items) {
      if (
        !item.product ||
        item.product.status !== "ACTIVE"
      ) {
        throw new Error(
          `Produk ${item.product?.name || item.productId} tidak aktif atau tidak ditemukan`
        );
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new Error(
          `Jumlah produk ${item.product.name} tidak valid`
        );
      }

      if (item.product.stock < item.quantity) {
        throw new Error(
          `Stok ${item.product.name} tidak mencukupi. Stok tersedia ${item.product.stock} ${item.product.unit}, request ${item.quantity} ${item.product.unit}`
        );
      }
    }

    for (const item of request.items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          status: "ACTIVE",
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (updated.count !== 1) {
        throw new Error(
          `Stok ${item.product.name} tidak mencukupi`
        );
      }

      await tx.stockMovement.create({
        data: {
          type: "OUT",
          quantity: -item.quantity,
          stockBefore: item.product.stock,
          stockAfter: item.product.stock - item.quantity,
          note: "Request disetujui",
          productId: item.productId,
          userId: Number(approvedById),
          requestId: request.id,
        },
      });
    }

    return tx.request.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: Number(approvedById),
        approvedAt: new Date(),
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
                price: true,
                category: true,
                image: true,
                stock: true,
                unit: true,
                status: true,
              },
            },
          },
        },
      },
    });
  });

  const notification = await notifyApprovedRequest(
    approvedRequest.requestNumber
  );

  const secret = process.env.INVENTORY_TRANSFER_SECRET;
  const posApiUrl = process.env.POS_API_URL;

  if (!secret || !posApiUrl) {
    console.error("Konfigurasi transfer POS belum lengkap");

    return {
      ...approvedRequest,
      transfer: {
        sent: false,
        message:
          "Request disetujui, tetapi konfigurasi transfer POS belum lengkap",
      },
      notification,
    };
  }

  try {
    const response = await fetch(
      `${posApiUrl.replace(/\/+$/, "")}/api/v1/inventory/stock-recive`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-inventory-transfer-secret": secret,
        },
        body: JSON.stringify({
          requestId: approvedRequest.requestNumber,
          items: approvedRequest.items.map((item) => ({
            productCode: item.product.code,
            name: item.product.name,
            price: Number(item.product.price),
            category: item.product.category || null,
            image: item.product.image || null,
            quantity: Number(item.quantity),
          })),
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      console.error("Transfer ke POS gagal:", {
        status: response.status,
        result,
      });

      return {
        ...approvedRequest,
        transfer: {
          sent: false,
          message:
            result?.message ||
            `POS merespons dengan status HTTP ${response.status}`,
        },
        notification,
      };
    }

    return {
      ...approvedRequest,
      transfer: {
        sent: true,
        message:
          result.message ||
          "Transfer berhasil dikirim ke POS",
        data: result.data,
      },
      notification,
    };
  } catch (error) {
    console.error("Pengiriman transfer ke POS gagal:", error);

    return {
      ...approvedRequest,
      transfer: {
        sent: false,
        message:
          "Request sudah disetujui, tetapi POS tidak dapat dijangkau. Transfer perlu dicoba kembali.",
      },
      notification,
    };
  }
}




export async function rejectRequestService(
  id,
  reason,
  rejectedById
) {
  if (!rejectedById) {
    throw new Error("User yang menolak request tidak ditemukan");
  }

  const request = await prisma.request.findUnique({
    where: { id },
  });

  if (!request) {
    throw new Error("Request tidak ditemukan");
  }

  if (request.status !== "PENDING") {
    throw new Error(
      "Request hanya dapat ditolak ketika status masih pending"
    );
  }

  const rejectionReason = reason?.trim();

  if (!rejectionReason) {
    throw new Error("Alasan penolakan wajib diisi");
  }

  const rejectedRequest = await prisma.request.updateMany({
    where: {
      id,
      status: "PENDING",
    },
    data: {
      status: "REJECTED",
      note: `Request ditolak: ${rejectionReason}`,
    },
  });

  if (rejectedRequest.count !== 1) {
    throw new Error(
      "Request sudah diproses oleh pengguna lain"
    );
  }

  const result = await prisma.request.findUnique({
    where: { id },
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

  let notificationSent = false;

  try {
    await sendRequestStatusNotification({
      requestNumber: result.requestNumber,
      status: "REJECTED",
      reason: rejectionReason,
    });

    notificationSent = true;
  } catch (error) {
    console.error("NOTIFICATION REJECT ERROR:", error);
  }

  return {
    ...result,
    notification: {
      sent: notificationSent,
      message: notificationSent
        ? "Notifikasi penolakan berhasil dikirim"
        : "Request ditolak, tetapi notifikasi POS belum terkirim",
    },
  };
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