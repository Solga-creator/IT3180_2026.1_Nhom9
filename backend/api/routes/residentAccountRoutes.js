import { Router } from "express";
import {
  approveResidentAccount,
  getResidentAccountOptions,
  getResidentAccounts,
  issueResidentAccount,
  removeResidentAccount,
  resetResidentPassword,
} from "../handlers/residentAccountHandlers.js";
import { requireAuth, requireStaff } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);
router.get("/candidates", getResidentAccountOptions);
router.get("/", getResidentAccounts);
router.post("/", issueResidentAccount);
router.patch("/:id/approve", approveResidentAccount);
router.post("/:id/reset-password", resetResidentPassword);
router.delete("/:id", removeResidentAccount);

export default router;
