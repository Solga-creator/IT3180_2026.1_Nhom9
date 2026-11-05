import { AppError } from "../helpers/AppError.js";
import {
  createResidencyEvent,
  createResident,
  listResidents,
} from "../repositories/residentRepository.js";
import {
  validateResidencyEvent,
  validateResidentInput,
} from "../validators/residentValidation.js";

export async function getResidents(search) {
  return listResidents(search);
}

export async function addResident(input) {
  const residentInput = {
    apartmentId: Number(input?.apartmentId),
    fullName: String(input?.fullName || "").trim(),
    birthDate: String(input?.birthDate || ""),
    relationship: String(input?.relationship || "").trim(),
  };

  const validationError = validateResidentInput(residentInput);
  if (validationError) {
    throw new AppError(400, validationError);
  }

  const result = await createResident(residentInput);
  if (result.reason === "APARTMENT_NOT_FOUND") {
    throw new AppError(404, "Không tìm thấy căn hộ.");
  }
  if (result.reason === "HOUSEHOLD_HEAD_REQUIRED") {
    throw new AppError(400, "Hãy thêm chủ hộ trước khi thêm nhân khẩu.");
  }
  if (result.reason === "HOUSEHOLD_HEAD_EXISTS") {
    throw new AppError(409, "Căn hộ này đã có chủ hộ.");
  }
  return result.resident;
}

export async function updateResidencyStatus(residentIdInput, input, userId) {
  const residentId = Number(residentIdInput);
  if (!Number.isInteger(residentId) || residentId <= 0) {
    throw new AppError(400, "Nhân khẩu không hợp lệ.");
  }

  const event = {
    status: String(input?.status || "").trim(),
    startDate: String(input?.startDate || ""),
    endDate: String(input?.endDate || ""),
  };
  const validationError = validateResidencyEvent(event);
  if (validationError) {
    throw new AppError(400, validationError);
  }

  const resident = await createResidencyEvent(residentId, event, userId);
  if (!resident) {
    throw new AppError(404, "Không tìm thấy nhân khẩu.");
  }
  return resident;
}
