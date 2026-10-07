import {
  getStocksService,
  getStockByProductIdService,
  getStockMovementsService,
  stockInService,
  stockOutService,
  adjustStockService,
} from "../services/stock.service.js";

export async function getStocks(req, res) {
  try {
    const stocks = await getStocksService();

    return res.status(200).json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getStockByProductId(
  req,
  res
) {
  try {
    const productId = Number(
      req.params.productId
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product ID tidak valid",
      });
    }

    const stock =
      await getStockByProductIdService(
        productId
      );

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getStockMovements(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      productId,
      type,
    } = req.query;

    const result = await getStockMovementsService({
      page,
      limit,
      productId,
      type,
    });

    return res.status(200).json({
      success: true,
      message: "Riwayat pergerakan stok berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(
      "GET STOCK MOVEMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal mengambil riwayat pergerakan stok",
    });
  }
}

export async function stockIn(req, res) {
  try {
    const productId = Number(
      req.params.productId
    );

    const quantity = Number(
      req.body.quantity
    );

    const note =
      req.body.note?.trim() || null;

    const userId = Number(
      req.user?.userId
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product ID tidak valid",
      });
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity harus berupa bilangan bulat lebih dari 0",
      });
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(401).json({
        success: false,
        message: "User tidak valid",
      });
    }

    const result =
      await stockInService(
        productId,
        quantity,
        note,
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Stok berhasil ditambahkan",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function stockOut(req, res) {
  try {
    const productId = Number(
      req.params.productId
    );

    const quantity = Number(
      req.body.quantity
    );

    const note =
      req.body.note?.trim() || null;

    const userId = Number(
      req.user?.userId
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product ID tidak valid",
      });
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity harus berupa bilangan bulat lebih dari 0",
      });
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(401).json({
        success: false,
        message: "User tidak valid",
      });
    }

    const result =
      await stockOutService(
        productId,
        quantity,
        note,
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Stok berhasil dikurangi",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function adjustStock(
  req,
  res
) {
  try {
    const productId = Number(
      req.params.productId
    );

    const stock = Number(
      req.body.stock
    );

    const note =
      req.body.note?.trim() || null;

    const userId = Number(
      req.user?.userId
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product ID tidak valid",
      });
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock harus berupa bilangan bulat 0 atau lebih",
      });
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(401).json({
        success: false,
        message: "User tidak valid",
      });
    }

    const result =
      await adjustStockService(
        productId,
        stock,
        note,
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Stok berhasil disesuaikan",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}