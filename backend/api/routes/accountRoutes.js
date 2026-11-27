import { Router } from "express";
import {
  getAccounts,
  issueAccount,
  removeAccount,
  resetStaffPassword,
} from "../handlers/accountHandlers.js";
import { requireAdmin, requireAuth } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);
router.post("/", issueAccount);
router.get("/", getAccounts);
router.post("/:id/reset-password", resetStaffPassword);
router.delete("/:id", removeAccount);

export default router;
