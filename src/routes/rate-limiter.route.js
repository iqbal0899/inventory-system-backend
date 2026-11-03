import express from "express";

import {
  resetLoginLimit,
  getLoginResetStatus,
} from "../middleware/rate-limiter.middleware.js";

const router = express.Router();

router.get("/status/:username", (req, res) => {
  const { username } = req.params;

  return res.status(200).json({
    success: true,
    resetAt: getLoginResetStatus(username),
  });
});

router.get("/:username", (req, res) => {
  try {
    const { username } = req.params;

    const resetAt = resetLoginLimit(username);

    return res.status(200).json({
      success: true,
      username: username.trim().toLowerCase(),
      resetAt,
      message: "Rate limit login berhasil direset.",
    });
  } catch (error) {
    console.error("RESET LOGIN LIMIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mereset rate limit login.",
    });
  }
});

export default router;