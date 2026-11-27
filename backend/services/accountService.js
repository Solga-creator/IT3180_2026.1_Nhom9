import crypto from "node:crypto";
import bcrypt from "bcrypt";
import {
  clearFailedLogin,
  countAdmins,
  createUser,
  deleteUser,
  findUserById,
  findUserByUsername,
  listUsers,
  updatePassword,
} from "../repositories/userRepository.js";
import { debug } from "../helpers/debug.js";
import { AppError } from "../helpers/AppError.js";
import { validateAccountIssue } from "../validators/accountValidation.js";

const TEMP_PW_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTemporaryPassword(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += TEMP_PW_CHARS[bytes[i] % TEMP_PW_CHARS.length];
  }
  return out;
}

export async function issueAccount(input) {
  const username = String(input?.username || "").trim();
  const fullName = String(input?.fullName || "").trim();
  const password = String(input?.password || "");
  const error = validateAccountIssue(username, fullName, password);
  if (error) {
    throw new AppError(400, error);
  }

  if (await findUserByUsername(username)) {
    throw new AppError(409, "Tên đăng nhập đã được cấp.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = await createUser({
    username,
    fullName,
    passwordHash,
  });
  debug("issued account", username);
  return {
    id,
    username,
    fullName,
    role: "BQT",
  };
}

export async function getAccounts() {
  const rows = await listUsers();
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  }));
}

export async function removeAccount(idInput, currentUserId) {
  const id = Number(idInput);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Tài khoản không hợp lệ.");
  }

  const target = await findUserById(id);
  if (!target) {
    throw new AppError(404, "Tài khoản không tồn tại.");
  }
  if (target.role === "RESIDENT") {
    throw new AppError(400, "Tài khoản cư dân được xóa ở màn hình cấp tài khoản cư dân.");
  }
  if (target.id === currentUserId) {
    throw new AppError(400, "Không thể xóa tài khoản đang đăng nhập.");
  }
  if (target.role === "ADMIN" && (await countAdmins()) <= 1) {
    throw new AppError(400, "Không thể xóa quản trị viên cuối cùng.");
  }

  await deleteUser(id);
  debug("deleted account", target.username);
  return target.username;
}

export async function resetStaffPassword(idInput, newPasswordInput) {
  const id = Number(idInput);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Tài khoản không hợp lệ.");
  }

  const customPw =
    typeof newPasswordInput === "string" ? newPasswordInput.trim() : "";
  const newPassword = customPw || generateTemporaryPassword(8);
  if (newPassword.length < 6) {
    throw new AppError(400, "Mật khẩu đặt lại tối thiểu 6 ký tự.");
  }

  const target = await findUserById(id);
  if (!target || target.role === "RESIDENT") {
    throw new AppError(404, "Tài khoản không tồn tại.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(id, passwordHash, { mustChangePassword: true });
  await clearFailedLogin(id);
  debug("reset staff password", target.username);
  return {
    username: target.username,
    temporaryPassword: newPassword,
    defaultPassword: newPassword,
    mustChangePassword: true,
  };
}
