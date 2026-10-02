import express from "express";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller.js";

const router = express.Router();

// GET semua supplier
router.get("/", getSuppliers);

// GET supplier berdasarkan ID
router.get("/:id", getSupplierById);

// POST supplier baru
router.post("/", createSupplier);

// PUT update supplier
router.put("/:id", updateSupplier);

// DELETE supplier
router.delete("/:id", deleteSupplier);

export default router;

