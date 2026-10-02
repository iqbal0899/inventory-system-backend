import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getInactiveProducts,
  getNextProductCode,
} from "../controllers/product.controller.js";

import {
  uploadProductImage,
} from "../middleware/upload.middleware.js";

const router = express.Router();

// ==========================================
// GET NEXT PRODUCT CODE
// ==========================================

router.get(
  "/next-code",
  getNextProductCode
);

// ==========================================
// GET INACTIVE PRODUCTS
// ==========================================

router.get(
  "/inactive",
  getInactiveProducts
);

// ==========================================
// GET ACTIVE PRODUCTS
// ==========================================

router.get(
  "/",
  getProducts
);

// ==========================================
// CREATE PRODUCT
// ==========================================

router.post(
  "/",
  uploadProductImage.single("image"),
  createProduct
);

// ==========================================
// GET PRODUCT BY ID
// ==========================================

router.get(
  "/:id",
  getProductById
);

// ==========================================
// UPDATE PRODUCT
// ==========================================

router.put(
  "/:id",
  uploadProductImage.single("image"),
  updateProduct
);

// ==========================================
// DELETE PRODUCT
// ==========================================

router.delete(
  "/:id",
  deleteProduct
);

// ==========================================
// RESTORE PRODUCT
// ==========================================

router.patch(
  "/:id/restore",
  restoreProduct
);

export default router;

