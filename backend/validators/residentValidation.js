export const RESIDENT_RELATIONSHIPS = [
  "Chủ hộ",
  "Vợ/chồng",
  "Con",
  "Cha/mẹ",
  "Anh/chị/em",
  "Khác",
];

export const RESIDENCY_STATUSES = [
  "Thường trú",
  "Tạm trú",
  "Tạm vắng",
  "Chuyển đến",
  "Chuyển đi",
];

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateResidentInput(input) {
  const apartmentId = Number(input?.apartmentId);
  const fullName = String(input?.fullName || "").trim();
  const birthDate = String(input?.birthDate || "");
  const relationship = String(input?.relationship || "").trim();

  if (!Number.isInteger(apartmentId) || apartmentId <= 0) {
    return "Chọn căn hộ hợp lệ.";
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return "Họ tên phải từ 2 đến 120 ký tự.";
  }
  if (!isValidDate(birthDate)) {
    return "Ngày sinh không hợp lệ.";
  }
  if (birthDate > new Date().toISOString().slice(0, 10)) {
    return "Ngày sinh không thể ở tương lai.";
  }
  if (!RESIDENT_RELATIONSHIPS.includes(relationship)) {
    return "Chọn quan hệ với chủ hộ hợp lệ.";
  }

  return null;
}

export function validateResidencyEvent(input) {
  const status = String(input?.status || "").trim();
  const startDate = String(input?.startDate || "");
  const endDate = String(input?.endDate || "");

  if (!RESIDENCY_STATUSES.includes(status)) {
    return "Chọn trạng thái cư trú hợp lệ.";
  }
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "Ngày bắt đầu và ngày kết thúc không hợp lệ.";
  }
  if (startDate > endDate) {
    return "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.";
  }

  return null;
}
