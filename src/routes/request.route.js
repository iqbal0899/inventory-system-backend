import express from "express";

import {
  getRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  deleteRequest,
} from "../controllers/request.controller.js";

import { authentication } from "../middleware/auth.middleware.js";
import { posServiceAuthentication } from "../middleware/posServiceAuth.middleware.js";

const router = express.Router();

router.post("/", posServiceAuthentication, createRequest);

router.use(authentication);

router.get("/", getRequests);
router.get("/:id", getRequestById);
router.patch("/:id/approve", approveRequest);
router.patch("/:id/reject", rejectRequest);
router.delete("/:id", deleteRequest);

export default router;