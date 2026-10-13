import {
  getRequestsService,
  getRequestByIdService,
  createRequestService,
  approveRequestService,
  rejectRequestService,
  deleteRequestService,
} from "../services/request.service.js";

function getValidRequestId(req, res) {
  const id = req.params.id?.trim();

  if (!id) {
    res.status(400).json({
      success: false,
      message: "ID request tidak valid",
    });

    return null;
  }

  return id;
}

export async function getRequests(req, res) {
  try {
    const result = await getRequestsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Data request berhasil diambil",
      data: result,
    });
  } catch (error) {
    console.error("GET REQUESTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengambil data request",
    });
  }
}

export async function getRequestById(req, res) {
  try {
    const id = getValidRequestId(req, res);

    if (!id) return;

    const result = await getRequestByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Detail request berhasil diambil",
      data: result,
    });
  } catch (error) {
    console.error("GET REQUEST DETAIL ERROR:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Request tidak ditemukan",
    });
  }
}

export async function createRequest(req, res) {
  try {
    const { items, note } = req.body;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal satu produk harus ditambahkan",
      });
    }

    for (const item of items) {
      if (
        !Number.isInteger(Number(item.productId)) ||
        Number(item.productId) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Product ID tidak valid",
        });
      }

      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Jumlah produk harus lebih dari 0",
        });
      }
    }

    const result = await createRequestService({
      items,
      note,
      requesterId: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Request berhasil dibuat",
      data: result,
    });
  } catch (error) {
    console.error("CREATE REQUEST ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Gagal membuat request",
    });
  }
}

export async function approveRequest(req, res) {
  try {
    const id = getValidRequestId(req, res);

    if (!id) return;

    const approvedById = req.user?.userId;

    if (!approvedById) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const result = await approveRequestService(
      id,
      approvedById
    );

    return res.status(200).json({
      success: true,
      message: "Request berhasil disetujui",
      data: result,
    });
  } catch (error) {
    console.error("APPROVE REQUEST ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Gagal menyetujui request",
    });
  }
}

export async function rejectRequest(req, res) {
  try {
    const id = getValidRequestId(req, res);

    if (!id) return;

    const rejectedById = req.user?.userId;
    const { reason } = req.body || {};

    if (!rejectedById) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan wajib diisi",
      });
    }

    const result = await rejectRequestService(
      id,
      String(reason).trim(),
      rejectedById
    );

    return res.status(200).json({
      success: true,
      message: "Request berhasil ditolak",
      data: result,
    });
  } catch (error) {
    console.error("REJECT REQUEST ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Gagal menolak request",
    });
  }
}

export async function deleteRequest(req, res) {
  try {
    const id = getValidRequestId(req, res);

    if (!id) return;

    const result = await deleteRequestService(id);

    return res.status(200).json({
      success: true,
      message: "Request berhasil dihapus",
      data: result,
    });
  } catch (error) {
    console.error("DELETE REQUEST ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Gagal menghapus request",
    });
  }
}
