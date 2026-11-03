import net from "node:net";

import {
  resetRateLimiter,
} from "../middleware/rate-limiter.middleware.js";

export const resetRateLimit = (req, res) => {
  const { ip } = req.body;

  if (!ip || net.isIP(ip) === 0) {
    return res.status(400).json({
      success: false,
      message: "Alamat IP tidak valid",
    });
  }

  resetRateLimiter(ip);

  return res.status(200).json({
    success: true,
    message: "Rate limiter berhasil direset",
  });
};