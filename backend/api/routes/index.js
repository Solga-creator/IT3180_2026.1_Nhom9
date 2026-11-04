import { Router } from "express";
import accountRoutes from "./accountRoutes.js";
import authRoutes from "./authRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);

export default router;
