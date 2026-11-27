import { Router } from "express";
import {
  changePassword,
  currentUser,
  login,
  saveProfile,
} from "../handlers/authHandlers.js";
import {
  getMyResidence,
  registerResidentAccount,
} from "../handlers/residentAccountHandlers.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();
router.post("/login", login);
router.post("/register-resident", registerResidentAccount);
router.get("/me", requireAuth, currentUser);
router.get("/residence", requireAuth, getMyResidence);
router.patch("/profile", requireAuth, saveProfile);
router.post("/password", requireAuth, changePassword);

export default router;
