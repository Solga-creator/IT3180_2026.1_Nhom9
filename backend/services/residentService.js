import ExcelJS from "exceljs";
import { AppError } from "../helpers/AppError.js";
import {
  createResidencyEvent,
  createResident,
  listResidents,
  listResidentsByStatus,
} from "../repositories/residentRepository.js";
import {
  validateResidencyEvent,
  validateResidentInput,
  RESIDENCY_STATUSES,
} from "../validators/residentValidation.js";

export async function getResidents(search) {
  return listResidents(search);
}

export async function exportResidents(status) {
  if (typeof status !== "string" || !RESIDENCY_STATUSES.includes(status)) {
    throw new AppError(400, "Chọn trạng thái cư trú hợp lệ để xuất Excel.");
  }

  const residents = await listResidentsByStatus(status);
  if (residents.length === 0) {
    throw new AppError(404, "Không có nhân khẩu thuộc trạng thái đã chọn.");
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Danh sách nhân khẩu");
  sheet.columns = [
    { header: "STT", key: "number", width: 8 },
    { header: "Căn hộ", key: "room", width: 16 },
    { header: "Họ và tên", key: "name", width: 32 },
    { header: "Ngày sinh", key: "birthDate", width: 16 },
    { header: "Quan hệ với chủ hộ", key: "relationship", width: 24 },
    { header: "Trạng thái cư trú", key: "status", width: 24 },
  ];
  residents.forEach((resident, index) => {
    sheet.addRow({
      number: index + 1,
      room: String(resident.room_number),
      name: resident.full_name,
      birthDate: new Date(`${resident.birth_date}T00:00:00.000Z`),
      relationship: resident.relationship_to_head,
      status: resident.current_status,
    });
  });
  sheet.getColumn("birthDate").numFmt = "dd/mm/yyyy";
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = "A1:F1";
  return workbook.xlsx.writeBuffer();
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
