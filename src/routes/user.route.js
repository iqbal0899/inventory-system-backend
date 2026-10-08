import { Router } from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

import {authentication} from "../middleware/auth.middleware.js";
import { superAdminOnly } from "../middleware/user.middleware.js";

const router = Router();

router.use(authentication);
router.use(superAdminOnly);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;