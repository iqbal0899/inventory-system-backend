import {
  getUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
} from "../services/user.service.js";

export async function getUsers(req, res) {
  try {
    const result = await getUsersService({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      role: req.query.role,
    });

    return res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      ...result,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengambil data user",
    });
  }
}

export async function getUserById(req, res) {
  try {
    const user = await getUserByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    const status =
      error.message === "User tidak ditemukan" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message || "Gagal mengambil data user",
    });
  }
}

export async function createUser(req, res) {
  try {
    const user = await createUserService(req.body);

    return res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Gagal membuat user",
    });
  }
}

export async function updateUser(req, res) {
  try {
    const user = await updateUserService(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);

    const status =
      error.message === "User tidak ditemukan" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message || "Gagal memperbarui user",
    });
  }
}

export async function deleteUser(req, res) {
  try {
    const user = await deleteUserService(
      req.params.id,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil dihapus",
      data: user,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    const status =
      error.message === "User tidak ditemukan" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message || "Gagal menghapus user",
    });
  }
}