import {
  getPurchasesService,
  getPurchaseByIdService,
  createPurchaseService,
  receivePurchaseService,
  cancelPurchaseService,
  deletePurchaseService,
} from "../services/purchase.service.js";

const handleError = (res, error) => {
  const message = error.message || "Terjadi kesalahan pada server";

  if (message.includes("tidak ditemukan")) {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  if (
    message.includes("tidak valid") ||
    message.includes("wajib") ||
    message.includes("Minimal") ||
    message.includes("harus berupa") ||
    message.includes("tidak boleh negatif")
  ) {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (
    message.includes("tidak dapat") ||
    message.includes("tidak boleh dihapus")
  ) {
    return res.status(409).json({
      success: false,
      message,
    });
  }

  console.error("Purchase error:", error);

  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
  });
};

export async function getPurchases(req, res) {
  try {
    const result = await getPurchasesService(req.query);

    return res.status(200).json({
      success: true,
      message: "Data pembelian berhasil diambil",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPurchaseById(req, res) {
  try {
    const purchase = await getPurchaseByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Detail pembelian berhasil diambil",
      data: purchase,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createPurchase(req, res) {
  try {
    const purchase = await createPurchaseService(req.body);

    return res.status(201).json({
      success: true,
      message: "Pembelian berhasil dibuat",
      data: purchase,
    });
  } catch (error) {
    return handleError(res, error);
  }
}


export async function receivePurchase(req, res) {
  try {
    const userId = req.user?.id ?? req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Pengguna belum terautentikasi",
      });
    }

    const purchase = await receivePurchaseService(
      req.params.id,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Pembelian berhasil diterima dan stok telah diperbarui",
      data: purchase,
    });
  } catch (error) {
    return handleError(res, error);
  }
}


export async function cancelPurchase(req, res) {
  try {
    const purchase = await cancelPurchaseService(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Pembelian berhasil dibatalkan",
      data: purchase,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deletePurchase(req, res) {
  try {
    const purchase = await deletePurchaseService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Data pembelian berhasil dihapus",
      data: purchase,
    });
  } catch (error) {
    return handleError(res, error);
  }
}