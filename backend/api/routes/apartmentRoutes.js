import { Router } from "express";
import {
  createApartment,
  getApartments,
} from "../handlers/apartmentHandlers.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth);
router.post("/", createApartment);
router.get("/", getApartments);

export default router;

