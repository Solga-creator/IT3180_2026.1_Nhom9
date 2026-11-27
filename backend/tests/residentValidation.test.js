import test from "node:test";
import assert from "node:assert/strict";
import {
  validateResidentInput,
  validateResidencyEvent,
  RESIDENT_RELATIONSHIPS,
  RESIDENCY_STATUSES,
} from "../validators/residentValidation.js";

test("US-002 Validation: Hợp lệ với dữ liệu chuẩn chủ hộ căn 050", () => {
  const error = validateResidentInput({
    apartmentId: 1,
    fullName: "Nguyễn Văn A",
    birthDate: "1985-05-15",
    relationship: "Chủ hộ",
  });
  assert.equal(error, null);
});

test("US-002 Validation: Hợp lệ với quan hệ thành viên và tên có khoảng trắng", () => {
  const error = validateResidentInput({
    apartmentId: "1",
    fullName: "  Nguyễn Văn B  ",
    birthDate: "2015-10-20",
    relationship: "Con",
  });
  assert.equal(error, null);
});

test("US-002 Validation: Bắt buộc chọn căn hộ nguyên dương", () => {
  assert.equal(
    validateResidentInput({ apartmentId: 0, fullName: "Nguyễn Văn A", birthDate: "1985-05-15", relationship: "Chủ hộ" }),
    "Chọn căn hộ hợp lệ.",
  );
  assert.equal(
    validateResidentInput({ apartmentId: -2, fullName: "Nguyễn Văn A", birthDate: "1985-05-15", relationship: "Chủ hộ" }),
    "Chọn căn hộ hợp lệ.",
  );
  assert.equal(
    validateResidentInput({ apartmentId: "abc", fullName: "Nguyễn Văn A", birthDate: "1985-05-15", relationship: "Chủ hộ" }),
    "Chọn căn hộ hợp lệ.",
  );
});

test("US-002 Validation: Họ tên phải từ 2 đến 120 ký tự", () => {
  assert.equal(
    validateResidentInput({ apartmentId: 1, fullName: "A", birthDate: "1985-05-15", relationship: "Chủ hộ" }),
    "Họ tên phải từ 2 đến 120 ký tự.",
  );
  assert.equal(
    validateResidentInput({ apartmentId: 1, fullName: "   ", birthDate: "1985-05-15", relationship: "Chủ hộ" }),
    "Họ tên phải từ 2 đến 120 ký tự.",
  );
  assert.equal(
    validateResidentInput({ apartmentId: 1, fullName: "A".repeat(121), birthDate: "1985-05-15", relationship: "Chủ hộ" }),
    "Họ tên phải từ 2 đến 120 ký tự.",
  );
});

test("US-002 Validation: Ngày sinh không được sai định dạng hoặc ở tương lai", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });
  assert.equal(
    validateResidentInput({ apartmentId: 1, fullName: "Nguyễn Văn A", birthDate: "2026-02-31", relationship: "Chủ hộ" }),
    "Ngày sinh không hợp lệ.",
  );
  const tomorrow = "2026-11-29";
  assert.equal(
    validateResidentInput({ apartmentId: 1, fullName: "Nguyễn Văn A", birthDate: tomorrow, relationship: "Chủ hộ" }),
    "Ngày sinh không thể ở tương lai.",
  );
});

test("US-002 Validation: Quan hệ với chủ hộ phải thuộc danh mục cho phép", () => {
  assert.equal(
    validateResidentInput({ apartmentId: 1, fullName: "Nguyễn Văn A", birthDate: "1990-01-01", relationship: "Khách" }),
    "Chọn quan hệ với chủ hộ hợp lệ.",
  );
  for (const rel of RESIDENT_RELATIONSHIPS) {
    assert.equal(
      validateResidentInput({ apartmentId: 1, fullName: "Nguyễn Văn A", birthDate: "1990-01-01", relationship: rel }),
      null,
    );
  }
});

test("US-004 Validation: Hợp lệ với 5 trạng thái cư trú và khoảng ngày đúng thứ tự", () => {
  for (const status of RESIDENCY_STATUSES) {
    assert.equal(
      validateResidencyEvent({ status, startDate: "2026-11-01", endDate: "2026-11-30" }),
      null,
    );
  }
  assert.equal(
    validateResidencyEvent({ status: "Tạm vắng", startDate: "2026-11-06", endDate: "2026-11-06" }),
    null,
  );
  assert.equal(
    validateResidencyEvent({ status: "Chuyển đi", startDate: "2026-11-28", endDate: "" }),
    null,
  );
});

test("US-004 Validation: Từ chối trạng thái lạ, ngày không có thật hoặc ngày bắt đầu sau ngày kết thúc", () => {
  assert.equal(
    validateResidencyEvent({ status: "Đi công tác", startDate: "2026-11-01", endDate: "2026-11-30" }),
    "Chọn trạng thái cư trú hợp lệ.",
  );
  assert.equal(
    validateResidencyEvent({ status: "Tạm vắng", startDate: "2026-02-30", endDate: "2026-03-10" }),
    "Ngày bắt đầu và ngày kết thúc không hợp lệ.",
  );
  assert.equal(
    validateResidencyEvent({ status: "Tạm vắng", startDate: "2026-11-20", endDate: "2026-11-05" }),
    "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
  );
});

test("US-002 Validation: Kiểm tra định dạng số CCCD/CMND (rỗng hoặc 9/12 chữ số)", () => {
  assert.equal(
    validateResidentInput({
      apartmentId: 1,
      fullName: "Nguyễn Văn A",
      birthDate: "1985-05-15",
      cccd: "001085012345",
      relationship: "Chủ hộ",
    }),
    null,
  );
  assert.equal(
    validateResidentInput({
      apartmentId: 1,
      fullName: "Nguyễn Văn A",
      birthDate: "1985-05-15",
      cccd: "12345abc",
      relationship: "Chủ hộ",
    }),
    "Số CCCD/CMND phải gồm 9 hoặc 12 chữ số.",
  );
});
