import { Router } from "express";
import {
  getAccounts,
  issueAccount,
  removeAccount,
} from "../handlers/accountHandlers.js";
import { requireAdmin, requireAuth } from "../../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);
router.post("/", issueAccount);
router.get("/", getAccounts);
router.delete("/:id", removeAccount);

export default router;
