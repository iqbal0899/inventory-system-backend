
import { loginUser } from "../services/auth.service.js";
import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(
        res,
        "Username dan password wajib diisi",
        400
      );
    }

    const result = await loginUser(username, password);

    if (!result?.token || !result?.user) {
      return errorResponse(
        res,
        "Data login tidak lengkap",
        500
      );
    }

    console.log("========================================");
    console.log("LOGIN BERHASIL");
    console.log("User ID  :", result.user.id);
    console.log("Username :", result.user.username);
    console.log("Role     :", result.user.role);
    console.log(
      "Waktu    :",
      new Date().toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "medium",
      })
    );
    console.log("========================================");

    res.cookie("inventory_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return successResponse(
      res,
      "Login berhasil",
      {
        user: result.user,
      },
      200
    );
  } catch (error) {
    console.error("Login error:", error.message);

    return errorResponse(
      res,
      "Login gagal",
      500
    );
  }
}

export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    message: "User berhasil ditemukan",
    data: {
      user: {
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role,
      },
    },
  });
}

export function logout(req, res) {
  console.log("========================================");
  console.log("LOGOUT");
  console.log("User ID  :", req.user?.userId || "-");
  console.log("Username :", req.user?.username || "-");
  console.log("Waktu    :", new Date().toLocaleString("id-ID"));
  console.log("========================================");

  res.clearCookie("inventory_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logout berhasil",
  });
}
