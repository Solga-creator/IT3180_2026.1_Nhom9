import {
  approveResidentAccount as approveAccount,
  getMyResidence as readMyResidence,
  getResidentAccountOptions as listOptions,
  getResidentAccounts as listAccounts,
  issueResidentAccount as createAccount,
  registerResidentAccount as registerAccount,
  removeResidentAccount as deleteAccount,
  resetResidentPassword as resetPassword,
} from "../../services/residentAccountService.js";

export async function getResidentAccountOptions(_req, res) {
  const residents = await listOptions();
  return res.json({
    success: true,
    residents,
  });
}

export async function getResidentAccounts(_req, res) {
  const accounts = await listAccounts();
  return res.json({
    success: true,
    accounts,
  });
}

export async function registerResidentAccount(req, res) {
  const account = await registerAccount(req.body);
  return res.status(201).json({
    success: true,
    account,
  });
}

export async function approveResidentAccount(req, res) {
  const account = await approveAccount(req.params.id);
  return res.json({
    success: true,
    account,
  });
}

export async function resetResidentPassword(req, res) {
  const result = await resetPassword(req.params.id, req.body?.newPassword);
  return res.json({
    success: true,
    ...result,
  });
}

export async function issueResidentAccount(req, res) {
  const account = await createAccount(req.body);
  return res.status(201).json({
    success: true,
    account,
  });
}

export async function removeResidentAccount(req, res) {
  const username = await deleteAccount(req.params.id);
  return res.json({
    success: true,
    username,
  });
}

export async function getMyResidence(req, res) {
  const residence = await readMyResidence(req.user);
  return res.json({
    success: true,
    residence,
  });
}
