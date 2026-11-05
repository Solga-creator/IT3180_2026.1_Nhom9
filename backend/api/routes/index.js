import { Router } from "express";
import accountRoutes from "./accountRoutes.js";
import apartmentRoutes from "./apartmentRoutes.js";
import authRoutes from "./authRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);
router.use("/apartments", apartmentRoutes);

export default router;
