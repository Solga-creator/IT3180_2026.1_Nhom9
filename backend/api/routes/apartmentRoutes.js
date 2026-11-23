import { Router } from "express";
import {
  createApartment,
  getApartments,
} from "../handlers/apartmentHandlers.js";
import { requireAuth, requireStaff } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);
router.post("/", createApartment);
router.get("/", getApartments);

export default router;

