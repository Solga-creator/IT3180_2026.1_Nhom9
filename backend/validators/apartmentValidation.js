export function validateApartmentInput(roomNumberInput, areaInput) {
  const roomNumber = String(roomNumberInput ?? "").trim();
  if (!roomNumber) {
    return "Số phòng là bắt buộc.";
  }
  if (roomNumber.length > 50) {
    return "Số phòng không được vượt quá 50 ký tự.";
  }

  if (
    areaInput === undefined ||
    areaInput === null ||
    String(areaInput).trim() === ""
  ) {
    return "Diện tích căn hộ là bắt buộc.";
  }

  const area = Number(areaInput);
  if (!Number.isFinite(area)) {
    return "Diện tích căn hộ phải là số hợp lệ.";
  }

  if (area <= 0) {
    return "Diện tích căn hộ phải lớn hơn 0 m².";
  }

  return null;
}

