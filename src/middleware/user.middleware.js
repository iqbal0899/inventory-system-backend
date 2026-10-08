export function superAdminOnly(req, res, next) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Akses hanya untuk SUPER_ADMIN",
    });
  }

  next();
}