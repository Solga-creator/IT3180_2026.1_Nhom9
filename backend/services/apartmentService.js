import {
  createApartment,
  findApartmentById,
  findApartmentByRoomNumber,
  listApartments,
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

