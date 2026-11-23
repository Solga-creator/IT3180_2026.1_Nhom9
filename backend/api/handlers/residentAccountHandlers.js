import {
  getMyResidence as readMyResidence,
  getResidentAccountOptions as listOptions,
  getResidentAccounts as listAccounts,
  issueResidentAccount as createAccount,
  removeResidentAccount as deleteAccount,
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
