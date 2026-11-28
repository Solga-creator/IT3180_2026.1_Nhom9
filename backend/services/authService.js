import bcrypt from "bcrypt";
import {
  clearFailedLogin,
  findPasswordHash,
  findUserById,
  findUserByUsername,
  recordFailedLogin,
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
import { getEffectiveResidencyStatuses } from "../repositories/residentRepository.js";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

export async function login(usernameInput, passwordInput) {
  const username = String(usernameInput || "").trim();
  const password = String(passwordInput || "");
  if (!username || !password) {
    throw new AppError(400, "Nhập tên đăng nhập và mật khẩu.");
  }

  const user = await findUserByUsername(username);
  if (user?.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    throw new AppError(
      423,
      "Tài khoản đang tạm khóa 5 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau.",
    );
  }

  const validPassword = user
    ? await bcrypt.compare(password, user.password_hash)
    : false;
  if (!validPassword) {
    if (user?.id) {
      const nextAttempts = Number(user.failed_login_attempts || 0) + 1;
      const lockedUntil =
        nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;
      await recordFailedLogin(user.id, nextAttempts, lockedUntil);
      if (lockedUntil) {
        throw new AppError(
          423,
          "Tài khoản đang tạm khóa 5 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau.",
        );
      }
    }
    debug("login failed", username);
    throw new AppError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  if (user.account_status === "PENDING") {
    throw new AppError(
      403,
      "Tài khoản đang chờ Ban quản trị phê duyệt. Vui lòng quay lại sau.",
    );
  }

  if (user.role === "RESIDENT") {
    const residentId = Number(user.resident_id);
    if (!Number.isInteger(residentId) || residentId <= 0) {
      throw new AppError(
        403,
        "Tài khoản chưa gắn với nhân khẩu đang cư trú hợp lệ.",
      );
    }
    const statusMap = await getEffectiveResidencyStatuses([residentId]);
    const effectiveStatus = statusMap.get(residentId);
    if (!effectiveStatus || effectiveStatus === "Chuyển đi") {
      throw new AppError(
        403,
        "Nhân khẩu đã chuyển đi, quyền truy cập thông tin hộ gia đình cũ đã kết thúc.",
      );
    }
  }

  if (user.failed_login_attempts > 0 || user.locked_until) {
    await clearFailedLogin(user.id);
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
  await updatePassword(userId, passwordHash, { mustChangePassword: false });
  const updatedUser = await findUserById(userId);
  if (!updatedUser) {
    return null;
  }
  return {
    token: signToken(updatedUser),
    user: toPublicUser(updatedUser),
  };
}
