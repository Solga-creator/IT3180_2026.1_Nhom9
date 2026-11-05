import test from "node:test";
import assert from "node:assert/strict";
import { validateApartmentInput } from "../validators/apartmentValidation.js";

test("US-001 Validation: Hợp lệ với căn hộ mẫu số phòng '050' và diện tích 60 m²", () => {
  const error = validateApartmentInput("050", 60);
  assert.equal(error, null);
});

test("US-001 Validation: Hợp lệ với số phòng chuỗi có khoảng trắng và diện tích số thực", () => {
  const error = validateApartmentInput("  12A04  ", "72.5");
  assert.equal(error, null);
});

test("US-001 Validation: Bắt buộc nhập số phòng (rỗng, null, undefined)", () => {
  assert.equal(validateApartmentInput("", 60), "Số phòng là bắt buộc.");
  assert.equal(validateApartmentInput("   ", 60), "Số phòng là bắt buộc.");
  assert.equal(validateApartmentInput(null, 60), "Số phòng là bắt buộc.");
  assert.equal(validateApartmentInput(undefined, 60), "Số phòng là bắt buộc.");
});

test("US-001 Validation: Số phòng không được vượt quá 50 ký tự", () => {
  const tooLongRoom = "A".repeat(51);
  assert.equal(
    validateApartmentInput(tooLongRoom, 60),
    "Số phòng không được vượt quá 50 ký tự.",
  );
});

test("US-001 Validation: Bắt buộc nhập diện tích", () => {
  assert.equal(
    validateApartmentInput("050", ""),
    "Diện tích căn hộ là bắt buộc.",
  );
  assert.equal(
    validateApartmentInput("050", null),
    "Diện tích căn hộ là bắt buộc.",
  );
  assert.equal(
    validateApartmentInput("050", undefined),
    "Diện tích căn hộ là bắt buộc.",
  );
});

test("US-001 Validation: Diện tích phải là số hợp lệ", () => {
  assert.equal(
    validateApartmentInput("050", "abc"),
    "Diện tích căn hộ phải là số hợp lệ.",
  );
  assert.equal(
    validateApartmentInput("050", NaN),
    "Diện tích căn hộ phải là số hợp lệ.",
  );
});

test("US-001 Validation: Diện tích bắt buộc phải lớn hơn 0 m²", () => {
  assert.equal(
    validateApartmentInput("050", 0),
    "Diện tích căn hộ phải lớn hơn 0 m².",
  );
  assert.equal(
    validateApartmentInput("050", -5),
    "Diện tích căn hộ phải lớn hơn 0 m².",
  );
  assert.equal(
    validateApartmentInput("050", "-0.01"),
    "Diện tích căn hộ phải lớn hơn 0 m².",
  );
});
