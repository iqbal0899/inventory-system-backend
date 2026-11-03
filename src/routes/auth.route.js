import express from "express";

import {
  login,
  getMe,
  logout,
} from "../controllers/auth.controller.js";

import {
  authLimiter,
} from "../middleware/rate-limiter.middleware.js";

import {
  authentication,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", authLimiter, login);

router.get("/me", authentication, getMe);

router.post("/logout", authentication, logout);

export default router;