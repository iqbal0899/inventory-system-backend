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

    // ==========================================
    // LOGIN LOG
    // ==========================================

    const loginTime = new Date();

    console.log("========================================");
    console.log("LOGIN BERHASIL");
    console.log("========================================");
    console.log("User ID   :", result.user.id);
    console.log("Username  :", result.user.username);
    console.log("Role      :", result.user.role);
    console.log(
      "Waktu     :",
      loginTime.toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "medium",
      })
    );
    console.log("JWT Token :", result.token);
    console.log("========================================");

    // ==========================================
    // COOKIE JWT
    // ==========================================

   res.cookie("inventory_token", token, {
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
    console.error("Login error:", error);

    return errorResponse(
      res,
      error.message || "Login gagal",
      401
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
  console.log("========================================");
  console.log("User ID  :", req.user?.userId || "-");
  console.log("Username :", req.user?.username || "-");
  console.log("Waktu    :", new Date().toLocaleString("id-ID"));
  console.log("========================================");

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout berhasil",
  });
}

