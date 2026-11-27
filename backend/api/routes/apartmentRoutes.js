import { Router } from "express";
import {
  createApartment,
  deleteApartment,
  getApartments,
  updateApartment,
} from "../handlers/apartmentHandlers.js";
import { requireAuth, requireStaff } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);
router.post("/", createApartment);
router.get("/", getApartments);
router.put("/:id", updateApartment);
router.delete("/:id", deleteApartment);

export default router;

