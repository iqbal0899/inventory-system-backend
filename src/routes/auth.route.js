import { Router } from "express";
import { login, getMe, logout } from "../controllers/auth.controller.js";
import { authentication } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);

router.get("/me", authentication, getMe)

router.post("/logout", logout);

export default router;