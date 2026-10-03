import { prisma } from "../config/database.js";

function getDateDaysAgo(days) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayName(date) {
  const days = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  return days[date.getDay()];
}

function createSevenDayMovement() {
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = getDateDaysAgo(i);

    result.push({
      date: formatDate(date),
      day: getDayName(date),
      stockIn: 0,
      stockOut: 0,
      total: 0,
    });
  }

  return result;
}

function formatStockMovement(stockMovements) {
  const result = createSevenDayMovement();

  for (const movement of stockMovements) {
    const movementDate = new Date(movement.createdAt);
    const dateKey = formatDate(movementDate);

    const dayData = result.find(
      (item) => item.date === dateKey
    );

    if (!dayData) {
      continue;
    }

    const quantity = Number(movement.quantity) || 0;

    if (movement.type === "IN") {
      dayData.stockIn += quantity;
    }

    if (movement.type === "OUT") {
      dayData.stockOut += quantity;
    }

    if (movement.type === "ADJUSTMENT") {
      const stockBefore =
        Number(movement.stockBefore) || 0;

      const stockAfter =
        Number(movement.stockAfter) || 0;

      if (stockAfter > stockBefore) {
        dayData.stockIn += stockAfter - stockBefore;
      }

      if (stockAfter < stockBefore) {
        dayData.stockOut += stockBefore - stockAfter;
      }
    }

    dayData.total =
      dayData.stockIn - dayData.stockOut;
  }

  return result;
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },

    select: {
      id: true,
      code: true,
      name: true,
      stock: true,
      minStock: true,
      unit: true,
      image: true,
    },

    orderBy: {
      stock: "asc",
    },
  });

  return products
    .filter((product) => {
      return product.stock <= product.minStock;
    })
    .slice(0, 10);
}

export async function getDashboardData() {
  const [
    totalProducts,
    totalStockResult,
    lowStockProducts,
    stockMovements,
  ] = await Promise.all([
    prisma.product.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.product.aggregate({
      where: {
        status: "ACTIVE",
      },

      _sum: {
        stock: true,
      },
    }),

    getLowStockProducts(),

    prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: getDateDaysAgo(6),
        },
      },

      select: {
        id: true,
        productId: true,
        type: true,
        quantity: true,
        stockBefore: true,
        stockAfter: true,
        createdAt: true,

        product: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const totalStock =
    totalStockResult._sum.stock ?? 0;

  const stockMovement =
    formatStockMovement(stockMovements);

  return {
    statistics: {
      totalProducts,
      totalStock: Number(totalStock),
      pendingRequests: 0,
      lowStock: lowStockProducts.length,
    },

    stockMovement,

    lowStockProducts,

    recentRequests: [],
  };
}