import bcrypt from "bcrypt";
import { AppError } from "../helpers/AppError.js";
import { debug } from "../helpers/debug.js";
import { validateResidentAccount } from "../validators/accountValidation.js";
import {
  createUser,
  deleteUser,
  findResidentIdentity,
  findResidenceForUser,
  findUserById,
  findUserByResidentId,
  findUserByUsername,
  listResidentAccounts,
  listResidentsWithoutAccount,
} from "../repositories/userRepository.js";

export async function getResidentAccountOptions() {
  const rows = await listResidentsWithoutAccount();
  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    roomNumber: row.room_number,
    relationship: row.relationship_to_head,
  }));
}

export async function getResidentAccounts() {
  const rows = await listResidentAccounts();
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    roomNumber: row.room_number,
    createdAt: row.created_at,
  }));
}

export async function issueResidentAccount(input) {
  const residentId = Number(input?.residentId);
  const username = String(input?.username || "").trim();
  const password = String(input?.password || "");
  if (!Number.isInteger(residentId) || residentId <= 0) {
    throw new AppError(400, "Chọn nhân khẩu cần cấp tài khoản.");
  }

  const error = validateResidentAccount(username, password);
  if (error) {
    throw new AppError(400, error);
  }

  const resident = await findResidentIdentity(residentId);
  if (!resident) {
    throw new AppError(404, "Nhân khẩu không tồn tại.");
  }
  if (await findUserByResidentId(residentId)) {
    throw new AppError(409, "Nhân khẩu này đã có tài khoản.");
  }
  if (await findUserByUsername(username)) {
    throw new AppError(409, "Tên đăng nhập đã được cấp.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = await createUser({
    username,
    fullName: resident.full_name,
    passwordHash,
    role: "RESIDENT",
    residentId,
  });
  debug("issued resident account", username);
  return {
    id,
    username,
    fullName: resident.full_name,
    roomNumber: resident.room_number,
    role: "RESIDENT",
  };
}

export async function removeResidentAccount(idInput) {
  const id = Number(idInput);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Tài khoản không hợp lệ.");
  }

  const target = await findUserById(id);
  if (!target || target.role !== "RESIDENT") {
    throw new AppError(404, "Tài khoản cư dân không tồn tại.");
  }

  await deleteUser(id);
  debug("deleted resident account", target.username);
  return target.username;
}

export async function getMyResidence(user) {
  if (user?.role !== "RESIDENT") {
    throw new AppError(403, "Chỉ cư dân xem thông tin căn hộ của mình.");
  }

  const residence = await findResidenceForUser(user.id);
  if (!residence) {
    throw new AppError(404, "Tài khoản chưa gắn với nhân khẩu.");
  }

  return {
    fullName: residence.full_name,
    roomNumber: residence.room_number,
    relationship: residence.relationship_to_head,
  };
}
