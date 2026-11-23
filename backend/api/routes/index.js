import { Router } from "express";
import accountRoutes from "./accountRoutes.js";
import apartmentRoutes from "./apartmentRoutes.js";
import authRoutes from "./authRoutes.js";
import residentAccountRoutes from "./residentAccountRoutes.js";
import residentRoutes from "./residentRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);
router.use("/apartments", apartmentRoutes);
router.use("/resident-accounts", residentAccountRoutes);
router.use("/residents", residentRoutes);

export default router;
