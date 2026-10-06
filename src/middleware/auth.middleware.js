import { verifyToken } from "../utils/jwt.js";

export function authentication(req, res, next) {
  try {
    const token = req.cookies?.token;

    console.log("AUTH TOKEN:", token ? "ADA" : "TIDAK ADA");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication diperlukan",
      });
    }

    const decoded = verifyToken(token);

    console.log("AUTH USER:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah expired",
    });
  }
}