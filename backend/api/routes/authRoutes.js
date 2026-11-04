import { Router } from "express";
import {
  changePassword,
  currentUser,
  login,
  saveProfile,
} from "../handlers/authHandlers.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();
router.post("/login", login);
router.get("/me", requireAuth, currentUser);
router.patch("/profile", requireAuth, saveProfile);
router.post("/password", requireAuth, changePassword);

export default router;
