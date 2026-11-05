import { Router } from "express";
import {
  createResidencyEvent,
  createResident,
  getResidents,
} from "../handlers/residentHandlers.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/", getResidents);
router.post("/", createResident);
router.post("/:id/residency-events", createResidencyEvent);

export default router;
