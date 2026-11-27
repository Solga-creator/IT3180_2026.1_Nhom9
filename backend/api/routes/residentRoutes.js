import { Router } from "express";
import {
  createResidencyEvent,
  createResident,
  deleteResident,
  getResidentHistory,
  getResidents,
  exportResidents,
  updateResident,
} from "../handlers/residentHandlers.js";
import { requireAuth, requireStaff } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);
router.get("/export", exportResidents);
router.get("/", getResidents);
router.get("/:id/history", getResidentHistory);
router.post("/", createResident);
router.put("/:id", updateResident);
router.delete("/:id", deleteResident);
router.post("/:id/residency-events", createResidencyEvent);

export default router;
