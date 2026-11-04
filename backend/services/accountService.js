import bcrypt from "bcrypt";
import {
  countAdmins,
  createUser,
  deleteUser,
  findUserById,
  findUserByUsername,
  listUsers,
} from "../repositories/userRepository.js";
import { debug } from "../helpers/debug.js";
import { AppError } from "../helpers/AppError.js";
import { validateAccountIssue } from "../validators/accountValidation.js";

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
