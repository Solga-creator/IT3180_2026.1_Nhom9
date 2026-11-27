import bcrypt from "bcrypt";
import { AppError } from "../helpers/AppError.js";
import { debug } from "../helpers/debug.js";
import { validateResidentAccount } from "../validators/accountValidation.js";
import { generateTemporaryPassword } from "./accountService.js";
import { resolveEffectiveResidencyStatus } from "../repositories/residentRepository.js";
import {
  clearFailedLogin,
  createUser,
  deleteUser,
  findResidentByRoomAndName,
  findResidentIdentity,
  findResidenceForUser,
  findUserById,
  findUserByResidentId,
  findUserByUsername,
  listHouseholdEventsByHouseholdId,
  listHouseholdMembersByHouseholdId,
  listResidentAccounts,
  listResidentsWithoutAccount,
  updateAccountStatus,
  updatePassword,
} from "../repositories/userRepository.js";

export function maskCccd(cccd, isSelf = false) {
  const raw = String(cccd || "").trim();
  if (!raw) return "";
  if (isSelf) return raw;
  return raw.length > 4
    ? `${"*".repeat(raw.length - 4)}${raw.slice(-4)}`
    : "****";
}

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
    accountStatus: row.account_status || "ACTIVE",
    fullName: row.full_name,
    roomNumber: row.room_number,
    createdAt: row.created_at,
  }));
}

export async function registerResidentAccount(input) {
  const roomNumber = String(input?.roomNumber || "").trim();
  const fullName = String(input?.fullName || "").trim();
  const username = String(input?.username || "").trim();
  const password = String(input?.password || "");

  if (!roomNumber || !fullName) {
    throw new AppError(400, "Nhập số phòng và họ tên nhân khẩu đã đăng ký với BQT.");
  }

  const error = validateResidentAccount(username, password);
  if (error) {
    throw new AppError(400, error);
  }

  const resident = await findResidentByRoomAndName(roomNumber, fullName);
  if (!resident) {
    throw new AppError(
      404,
      "Không tìm thấy nhân khẩu khớp số phòng và họ tên. Vui lòng liên hệ Ban quản trị.",
    );
  }
  if (resident.current_status === "Chuyển đi") {
    throw new AppError(
      400,
      "Nhân khẩu đã chuyển đi, không thể đăng ký tài khoản cư dân.",
    );
  }

  if (await findUserByResidentId(resident.id)) {
    throw new AppError(409, "Nhân khẩu này đã có tài khoản hoặc đang chờ duyệt.");
  }
  if (await findUserByUsername(username)) {
    throw new AppError(409, "Tên đăng nhập đã tồn tại.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = await createUser({
    username,
    fullName: resident.full_name,
    passwordHash,
    role: "RESIDENT",
    residentId: resident.id,
    accountStatus: "PENDING",
  });
  debug("registered pending resident account", username);
  return {
    id,
    username,
    fullName: resident.full_name,
    roomNumber: resident.room_number,
    accountStatus: "PENDING",
  };
}

export async function approveResidentAccount(idInput) {
  const id = Number(idInput);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Tài khoản không hợp lệ.");
  }

  const target = await findUserById(id);
  if (!target || target.role !== "RESIDENT") {
    throw new AppError(404, "Tài khoản cư dân không tồn tại.");
  }

  await updateAccountStatus(id, "ACTIVE");
  debug("approved resident account", target.username);
  return {
    id: target.id,
    username: target.username,
    accountStatus: "ACTIVE",
  };
}

export async function resetResidentPassword(idInput, newPasswordInput) {
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
  if (!target || target.role !== "RESIDENT") {
    throw new AppError(404, "Tài khoản cư dân không tồn tại.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(id, passwordHash, { mustChangePassword: true });
  await clearFailedLogin(id);
  debug("reset resident password", target.username);
  return {
    username: target.username,
    temporaryPassword: newPassword,
    defaultPassword: newPassword,
    mustChangePassword: true,
  };
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
  if (resident.current_status === "Chuyển đi") {
    throw new AppError(
      400,
      "Nhân khẩu đã chuyển đi, không thể cấp tài khoản cư dân.",
    );
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
    accountStatus: "ACTIVE",
  });
  debug("issued resident account", username);
  return {
    id,
    username,
    fullName: resident.full_name,
    roomNumber: resident.room_number,
    role: "RESIDENT",
    accountStatus: "ACTIVE",
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
  if (residence.current_status === "Chuyển đi") {
    throw new AppError(
      403,
      "Nhân khẩu đã chuyển đi, quyền truy cập thông tin hộ gia đình cũ đã kết thúc.",
    );
  }

  const [members, events] = await Promise.all([
    residence.household_id
      ? listHouseholdMembersByHouseholdId(residence.household_id)
      : [],
    residence.household_id
      ? listHouseholdEventsByHouseholdId(residence.household_id)
      : [],
  ]);

  const selfEvents = events.filter((e) => e.resident_id === residence.resident_id);
  const selfEffective = resolveEffectiveResidencyStatus(residence, selfEvents);
  if (selfEffective.currentStatus === "Chuyển đi") {
    throw new AppError(
      403,
      "Nhân khẩu đã chuyển đi, quyền truy cập thông tin hộ gia đình cũ đã kết thúc.",
    );
  }

  const membersWithEffectiveStatus = members.map((m) => {
    const memberEvents = events.filter((e) => e.resident_id === m.id);
    const effective = resolveEffectiveResidencyStatus(m, memberEvents);
    return {
      ...m,
      current_status: effective.currentStatus,
      status_start_date: effective.statusStartDate,
      status_end_date: effective.statusEndDate,
    };
  });

  const activeMembers = membersWithEffectiveStatus.filter(
    (m) => m.current_status !== "Chuyển đi",
  );
  const head = activeMembers.find((m) => m.relationship_to_head === "Chủ hộ");

  return {
    fullName: residence.full_name,
    birthDate: residence.birth_date,
    cccd: maskCccd(residence.cccd, true),
    roomNumber: residence.room_number,
    area: residence.area ? Number(residence.area) : null,
    relationship: residence.relationship_to_head,
    currentStatus: selfEffective.currentStatus || "Thường trú",
    headName: head ? head.full_name : residence.full_name,
    memberCount: activeMembers.length || 1,
    members: activeMembers.map((m) => ({
      id: m.id,
      fullName: m.full_name,
      birthDate: m.birth_date,
      cccd: maskCccd(m.cccd, m.id === residence.resident_id),
      relationship: m.relationship_to_head,
      currentStatus: m.current_status,
      statusStartDate: m.status_start_date,
      statusEndDate: m.status_end_date,
    })),
    residencyHistory: events.map((e) => ({
      id: e.id,
      residentName: e.full_name,
      status: e.status,
      startDate: e.start_date,
      endDate: e.end_date,
    })),
  };
}
