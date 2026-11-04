import {
  getAccounts as listAccounts,
  issueAccount as createAccount,
  removeAccount as deleteAccount,
} from "../../services/accountService.js";

export async function issueAccount(req, res) {
  const user = await createAccount(req.body);
  return res.status(201).json({
    success: true,
    user,
  });
}

export async function getAccounts(_req, res) {
  const users = await listAccounts();
  return res.json({
    success: true,
    users,
  });
}

export async function removeAccount(req, res) {
  const username = await deleteAccount(req.params.id, req.user.id);
  return res.json({
    success: true,
    username,
  });
}
