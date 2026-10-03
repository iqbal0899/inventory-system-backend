import express from "express";
import {
  getStocks,
  getStockByProductId,
  getStockMovements,
  stockIn,
  stockOut,
  adjustStock,
} from "../controllers/stock.controller.js";
import { authentication } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authentication);

router.get("/", getStocks);
router.get("/:productId", getStockByProductId);
router.get("/:productId/movements", getStockMovements);
router.post("/:productId/in", stockIn);
router.post("/:productId/out", stockOut);
router.patch("/:productId/adjust", adjustStock);

export default router;