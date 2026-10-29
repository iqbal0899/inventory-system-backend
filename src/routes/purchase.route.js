import { Router } from "express";

import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  receivePurchase,
  cancelPurchase,
  deletePurchase,
} from "../controllers/purchase.controller.js";

import { authentication } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRole.js";

const router = Router();

router.get("/", authentication, getPurchases);
router.get("/:id", authentication, getPurchaseById);
router.post("/", authentication, createPurchase);
router.patch("/:id/receive", authentication, authorizeRoles("ADMIN", "SUPER_ADMIN"), receivePurchase);
router.patch("/:id/cancel", authentication, authorizeRoles("ADMIN", "SUPER_ADMIN"), cancelPurchase);
router.delete("/:id", authentication, deletePurchase);

export default router;