import {
  createApartment,
  deleteEmptyApartmentById,
  findApartmentById,
  findApartmentByRoomNumber,
  listApartments,
  updateApartmentById,
} from "../repositories/apartmentRepository.js";
import { AppError } from "../helpers/AppError.js";
import { debug } from "../helpers/debug.js";
import { validateApartmentInput } from "../validators/apartmentValidation.js";

export async function saveApartment(input) {
  const roomNumber = String(input?.roomNumber ?? "").trim();
  const areaRaw = input?.area;

  const validationError = validateApartmentInput(roomNumber, areaRaw);
  if (validationError) {
    throw new AppError(400, validationError);
  }

  const area = Number(areaRaw);

  const existing = await findApartmentByRoomNumber(roomNumber);
  if (existing) {
    throw new AppError(409, `Số phòng "${roomNumber}" đã tồn tại trong danh mục.`);
  }

  const id = await createApartment({
    roomNumber,
    area,
  });

  debug("saved apartment", roomNumber, `${area} m²`);
  return findApartmentById(id);
}

export async function getApartments() {
  return listApartments();
}

export async function editApartment(idInput, input) {
  const id = Number(idInput);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Căn hộ không hợp lệ.");
  }

  const roomNumber = String(input?.roomNumber ?? "").trim();
  const areaRaw = input?.area;

  const validationError = validateApartmentInput(roomNumber, areaRaw);
  if (validationError) {
    throw new AppError(400, validationError);
  }

  const current = await findApartmentById(id);
  if (!current) {
    throw new AppError(404, "Không tìm thấy căn hộ.");
  }

  const existing = await findApartmentByRoomNumber(roomNumber);
  if (existing && existing.id !== id) {
    throw new AppError(409, `Số phòng "${roomNumber}" đã tồn tại trong danh mục.`);
  }

  const area = Number(areaRaw);
  const updated = await updateApartmentById(id, { roomNumber, area });
  debug("updated apartment", roomNumber, `${area} m²`);
  return updated;
}

export async function removeApartment(idInput) {
  const id = Number(idInput);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Căn hộ không hợp lệ.");
  }

  const result = await deleteEmptyApartmentById(id);
  if (result.reason === "NOT_FOUND") {
    throw new AppError(404, "Không tìm thấy căn hộ.");
  }
  if (result.reason === "HAS_RESIDENTS") {
    throw new AppError(
      400,
      "Không thể xóa căn hộ đang có nhân khẩu. Hãy xóa hoặc chuyển nhân khẩu trước.",
    );
  }

  debug("deleted apartment", result.apartment.roomNumber);
  return result.apartment.roomNumber;
}

