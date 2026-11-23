import { Router } from "express";
import {
  getResidentAccountOptions,
  getResidentAccounts,
  issueResidentAccount,
  removeResidentAccount,
} from "../handlers/residentAccountHandlers.js";
import { requireAuth, requireStaff } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);
router.get("/candidates", getResidentAccountOptions);
router.get("/", getResidentAccounts);
router.post("/", issueResidentAccount);
router.delete("/:id", removeResidentAccount);

export default router;
