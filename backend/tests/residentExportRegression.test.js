import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { pool } from "../config/database.js";
import { exportResidents } from "../services/residentService.js";
import { isResidencyEventEffective } from "../repositories/residentRepository.js";
import { validateResidentInput } from "../validators/residentValidation.js";

test("Excel uses effective status and exact apartment ID, including a matching room substring", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });
  const rows = [
    { id: 1, apartment_id: 1, room_number: "101", full_name: "Người hết tạm vắng", birth_date: "2000-01-01", relationship_to_head: "Chủ hộ", current_status: "Tạm vắng" },
    { id: 2, apartment_id: 1, room_number: "101", full_name: "Người bắt đầu tạm vắng", birth_date: "2000-01-01", relationship_to_head: "Con", current_status: "Thường trú" },
    { id: 3, apartment_id: 2, room_number: "1101", full_name: "Người phòng khác", birth_date: "2000-01-01", relationship_to_head: "Chủ hộ", current_status: "Thường trú" },
  ];
  const events = [
    { id: 2, resident_id: 2, status: "Tạm vắng", start_date: "2026-11-28", end_date: null },
    { id: 1, resident_id: 1, status: "Tạm vắng", start_date: "2026-11-01", end_date: "2026-11-20" },
  ];
  t.mock.method(pool, "query", async (sql, params) => {
    if (/FROM residency_events/.test(sql)) return [events, []];
    if (/WHERE a\.id = \?/.test(sql)) {
      assert.deepEqual(params, [1]);
      return [rows.filter((row) => row.apartment_id === params[0]), []];
    }
    return [rows.filter((row) => row.current_status === params[0]), []];
  });
  for (const [status, expectedName] of [["Thường trú", rows[0].full_name], ["Tạm vắng", rows[1].full_name]]) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exportResidents(status, "", { apartmentId: 1 }));
    const sheet = workbook.worksheets[0];
    assert.equal(sheet.rowCount, 2);
    assert.equal(sheet.getCell("B2").value, "101");
    assert.equal(sheet.getCell("C2").value, expectedName);
    assert.equal(sheet.getCell("F2").value, status);
  }
});

test("Vietnam business date applies at local midnight for residency and birth validation", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });
  assert.equal(isResidencyEventEffective({ startDate: "2026-11-28" }), true);
  assert.equal(validateResidentInput({ apartmentId: 1, fullName: "Em bé", birthDate: "2026-11-28", relationship: "Con" }), null);
});
