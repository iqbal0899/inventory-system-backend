export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = String(req.user?.role ?? "").toUpperCase();

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk aksi ini",
      });
    }

    next();
  };
};