import express from "express";

import {
  getDashboard,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

/**
 * GET /api/v1/dashboard
 */
router.get("/", getDashboard);

export default router;