import {
  createSupplierService,
  getSuppliersService,
  getSupplierByIdService,
  updateSupplierService,
  deleteSupplierService,
} from "../services/supplier.service.js";

// ========================================
// CREATE
// ========================================

export async function createSupplier(req, res) {
  try {
    const {
      name,
      phone,
      email,
      address,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama supplier wajib diisi",
      });
    }

    const supplier =
      await createSupplierService({
        name,
        phone,
        email,
        address,
      });

    return res.status(201).json({
      success: true,
      message: "Supplier berhasil ditambahkan",
      data: supplier,
    });
  } catch (error) {
    console.error(
      "CREATE SUPPLIER ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Gagal menambahkan supplier",
    });
  }
}

// ========================================
// GET ALL
// ========================================

export async function getSuppliers(req, res) {
  try {
    const suppliers =
      await getSuppliersService();

    return res.status(200).json({
      success: true,
      message: "Data supplier berhasil diambil",
      data: suppliers,
    });
  } catch (error) {
    console.error(
      "GET SUPPLIERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal mengambil data supplier",
    });
  }
}

// ========================================
// GET BY ID
// ========================================

export async function getSupplierById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID supplier tidak valid",
      });
    }

    const supplier =
      await getSupplierByIdService(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data supplier berhasil diambil",
      data: supplier,
    });
  } catch (error) {
    console.error(
      "GET SUPPLIER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal mengambil data supplier",
    });
  }
}

// ========================================
// UPDATE
// ========================================

export async function updateSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID supplier tidak valid",
      });
    }

    const {
      name,
      phone,
      email,
      address,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama supplier wajib diisi",
      });
    }

    const supplier =
      await updateSupplierService(id, {
        name,
        phone,
        email,
        address,
      });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier berhasil diperbarui",
      data: supplier,
    });
  } catch (error) {
    console.error(
      "UPDATE SUPPLIER ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Gagal memperbarui supplier",
    });
  }
}

// ========================================
// DELETE
// ========================================

export async function deleteSupplier(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID supplier tidak valid",
      });
    }

    const supplier =
      await deleteSupplierService(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier berhasil dihapus",
      data: supplier,
    });
  } catch (error) {
    console.error(
      "DELETE SUPPLIER ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Gagal menghapus supplier",
    });
  }
}

