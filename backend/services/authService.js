import bcrypt from "bcrypt";
import {
  findPasswordHash,
  findUserByUsername,
  toPublicUser,
  updatePassword,
  updateProfile,
} from "../repositories/userRepository.js";
import { debug } from "../helpers/debug.js";
import { AppError } from "../helpers/AppError.js";
import { signToken } from "../middlewares/auth.js";
import {
  validatePasswordChange,
  validateProfile,
} from "../validators/authValidation.js";

export async function login(usernameInput, passwordInput) {
  const username = String(usernameInput || "").trim();
  const password = String(passwordInput || "");
  if (!username || !password) {
    throw new AppError(400, "Nhập tên đăng nhập và mật khẩu.");
  }

  const user = await findUserByUsername(username);
  const validPassword = user
    ? await bcrypt.compare(password, user.password_hash)
    : false;
  if (!validPassword) {
    debug("login failed", username);
    throw new AppError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  debug("login ok", username);
  return {
    token: signToken(user),
    user: toPublicUser(user),
  };
}

export async function saveProfile(userId, profile) {
  const fullName = String(profile?.fullName || "").trim();
  const phone = String(profile?.phone || "").trim();
  const error = validateProfile(fullName, phone);
  if (error) {
    throw new AppError(400, error);
  }

  const user = await updateProfile(userId, {
    fullName,
    phone,
  });
  return toPublicUser(user);
}

export async function changePassword(userId, input) {
  const currentPassword = input?.currentPassword;
  const newPassword = input?.newPassword;
  const error = validatePasswordChange(currentPassword, newPassword);
  if (error) {
    throw new AppError(400, error);
  }

  const currentHash = await findPasswordHash(userId);
  const currentPasswordIsValid = currentHash
    ? await bcrypt.compare(currentPassword, currentHash)
    : false;
  if (!currentPasswordIsValid) {
    throw new AppError(400, "Mật khẩu hiện tại không đúng.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(userId, passwordHash);
}
