import { verifyToken } from "../utils/jwt.js";

export function authentication(req, res, next) {
  try {
const token = req.cookies?.inventory_token;

if (!token) {
  return res.status(401).json({
    success: false,
    message: "Authentication diperlukan",
  });
}

const decoded = verifyToken(token);

if (!decoded) {
  return res.status(401).json({
    success: false,
    message: "Token tidak valid atau sudah expired",
  });
}

req.user = decoded;
return next();

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah expired",
    });
  }
}