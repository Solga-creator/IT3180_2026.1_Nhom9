import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { pool } from "../config/database.js";
import { exportResidents, getResidents } from "../services/residentService.js";
import { isResidencyEventEffective } from "../repositories/residentRepository.js";
import { validateResidentInput } from "../validators/residentValidation.js";

function createSqlAwareResidentMock(rows, events) {
  return async (sql, params = []) => {
    if (/FROM residency_events/.test(sql)) {
      const idSet = new Set(params.map(Number));
      return [events.filter((ev) => idSet.has(ev.resident_id)), []];
    }

    let result = [...rows];
    let paramIndex = 0;

    if (/a\.room_number LIKE \? OR r\.full_name LIKE \?/.test(sql)) {
      const roomKw = String(params[paramIndex++] || "").replace(/^%|%$/g, "").toLowerCase();
      const nameKw = String(params[paramIndex++] || "").replace(/^%|%$/g, "").toLowerCase();
      result = result.filter(
        (row) =>
          String(row.room_number).toLowerCase().includes(roomKw) ||
          String(row.full_name).toLowerCase().includes(nameKw),
      );
    }

    if (/r\.current_status = \?/.test(sql)) {
      const rawStatus = params[paramIndex++];
      result = result.filter((row) => row.current_status === rawStatus);
    }

    if (/a\.id = \?/.test(sql)) {
      const aptId = Number(params[paramIndex++]);
      result = result.filter((row) => Number(row.apartment_id) === aptId);
    }

    assert.equal(paramIndex, params.length, `Unexpected SQL params for: ${sql}`);
    return [result, []];
  };
}

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

test("listResidents filters by effective Vietnam date status and matches Excel export", async (t) => {
  // 2026-11-27T18:00:00Z = 2026-11-28 01:00:00 Asia/Ho_Chi_Minh
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });
  const rows = [
    {
      id: 1,
      household_id: 10,
      apartment_id: 1,
      room_number: "101",
      full_name: "Hết tạm vắng 27/11",
      birth_date: "1990-01-01",
      relationship_to_head: "Chủ hộ",
      current_status: "Tạm vắng",
      status_start_date: "2026-11-01",
      status_end_date: "2026-11-27",
    },
    {
      id: 2,
      household_id: 10,
      apartment_id: 1,
      room_number: "101",
      full_name: "Bắt đầu tạm vắng 28/11",
      birth_date: "1992-01-01",
      relationship_to_head: "Vợ/chồng",
      current_status: "Thường trú",
      status_start_date: null,
      status_end_date: null,
    },
    {
      id: 3,
      household_id: 10,
      apartment_id: 1,
      room_number: "101",
      full_name: "Tạm trú tương lai 29/11",
      birth_date: "2010-01-01",
      relationship_to_head: "Con",
      current_status: "Thường trú",
      status_start_date: null,
      status_end_date: null,
    },
    {
      id: 4,
      household_id: 20,
      apartment_id: 2,
      room_number: "102",
      full_name: "Tạm trú hết hạn cuối 28/11",
      birth_date: "1988-05-05",
      relationship_to_head: "Chủ hộ",
      current_status: "Thường trú",
      status_start_date: null,
      status_end_date: null,
    },
    {
      id: 5,
      household_id: 30,
      apartment_id: 3,
      room_number: "1101",
      full_name: "Phòng chuỗi con 1101",
      birth_date: "1985-03-03",
      relationship_to_head: "Chủ hộ",
      current_status: "Thường trú",
      status_start_date: null,
      status_end_date: null,
    },
  ];
  const events = [
    { id: 101, resident_id: 1, status: "Tạm vắng", start_date: "2026-11-01", end_date: "2026-11-27" },
    { id: 102, resident_id: 2, status: "Tạm vắng", start_date: "2026-11-28", end_date: null },
    { id: 103, resident_id: 3, status: "Tạm trú", start_date: "2026-11-29", end_date: "2026-12-10" },
    { id: 104, resident_id: 4, status: "Tạm trú", start_date: "2026-11-20", end_date: "2026-11-28" },
  ];

  t.mock.method(pool, "query", createSqlAwareResidentMock(rows, events));

  // No status filter: all 5 residents with resolved effective statuses
  const all = await getResidents("");
  assert.deepEqual(
    all.map((r) => [r.id, r.currentStatus]),
    [
      [1, "Thường trú"],
      [2, "Tạm vắng"],
      [3, "Thường trú"],
      [4, "Tạm trú"],
      [5, "Thường trú"],
    ],
  );

  // Filter by each status: assert exact included & excluded IDs
  const thuongTru = await getResidents("", { status: "Thường trú" });
  assert.deepEqual(thuongTru.map((r) => r.id), [1, 3, 5]);
  assert.ok(!thuongTru.some((r) => r.id === 2 || r.id === 4));

  const tamVang = await getResidents("", { status: "Tạm vắng" });
  assert.deepEqual(tamVang.map((r) => r.id), [2]);
  assert.ok(!tamVang.some((r) => r.id === 1));

  const tamTru = await getResidents("", { status: "Tạm trú" });
  assert.deepEqual(tamTru.map((r) => r.id), [4]);
  assert.ok(!tamTru.some((r) => r.id === 3));

  // Combined search + apartmentId + status excludes room 1101 (id 5) and id 2
  const combined = await getResidents("101", { apartmentId: 1, status: "Thường trú" });
  assert.deepEqual(combined.map((r) => r.id), [1, 3]);
  assert.ok(!combined.some((r) => r.id === 5 || r.id === 2));

  // includeHistory: false still resolves effective status while hiding history array
  const noHistory = await getResidents("", { status: "Tạm vắng", includeHistory: false });
  assert.deepEqual(noHistory.map((r) => r.id), [2]);
  assert.equal(noHistory[0].currentStatus, "Tạm vắng");
  assert.deepEqual(noHistory[0].residencyHistory, []);

  // Cross-check listResidents vs Excel export on the same fixture
  for (const status of ["Thường trú", "Tạm vắng", "Tạm trú"]) {
    const listed = await getResidents("", { status });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await exportResidents(status));
    const sheet = workbook.worksheets[0];
    const exportedNames = [];
    for (let r = 2; r <= sheet.rowCount; r += 1) {
      exportedNames.push(sheet.getCell(`C${r}`).value);
    }
    assert.deepEqual(
      exportedNames,
      listed.map((r) => r.fullName),
      `Excel export mismatch for status ${status}`,
    );
  }
});

test("Vietnam business date applies at local midnight for residency and birth validation", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });
  assert.equal(isResidencyEventEffective({ startDate: "2026-11-28" }), true);
  assert.equal(validateResidentInput({ apartmentId: 1, fullName: "Em bé", birthDate: "2026-11-28", relationship: "Con" }), null);
});
