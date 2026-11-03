import { rateLimit } from "express-rate-limit";

const normalizeUsername = (username) =>
  String(username || "").trim().toLowerCase();

const loginResetVersions = new Map();

export const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  keyGenerator: (req) => {
    const username = normalizeUsername(req.body?.username);
    return `login:${username || "unknown"}`;
  },

  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;

    const retryAfter = resetTime
      ? Math.max(
          1,
          Math.ceil(
            (resetTime.getTime() - Date.now()) / 1000
          )
        )
      : 1800;

    res.setHeader("Retry-After", String(retryAfter));

    return res.status(429).json({
      success: false,
      message:
        "Akun terkunci karena gagal login 3 kali. Silakan coba kembali setelah 30 menit atau hubungi administrator untuk membuka akun.",
      retryAfter,
    });
  },
});

export const resetLoginLimit = (username) => {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    throw new Error("Username tidak valid.");
  }

  authLimiter.resetKey(`login:${normalizedUsername}`);

  const resetAt = Date.now();

  loginResetVersions.set(normalizedUsername, resetAt);

  return resetAt;
};

export const getLoginResetStatus = (username) => {
  const normalizedUsername = normalizeUsername(username);

  return loginResetVersions.get(normalizedUsername) || 0;
};