import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { pool } from "../config/database.js";
import { exportResidents } from "../services/residentService.js";

test("US-005: từ chối trạng thái không hợp lệ trước khi truy vấn", async (t) => {
  t.mock.method(pool, "query", async () => assert.fail("Không được truy vấn"));
  for (const status of [undefined, "", "Tất cả", "Tạm vắng' OR 1=1", ["Tạm trú"]]) {
    await assert.rejects(exportResidents(status), { statusCode: 400 });
  }
});

test("US-005: thông báo khi không có nhân khẩu phù hợp", async (t) => {
  t.mock.method(pool, "query", async () => [[], []]);
  await assert.rejects(exportResidents("Chuyển đi"), {
    statusCode: 404,
    message: "Không có nhân khẩu thuộc trạng thái đã chọn.",
  });
});

test("US-005: Excel giữ tiếng Việt, số phòng, kiểu ngày và dữ liệu dạng văn bản", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    assert.match(sql, /WHERE r.current_status = \?/);
    assert.doesNotMatch(sql, /JOIN residency_events/);
    assert.deepEqual(params, ["Tạm vắng"]);
    return [[
      { room_number: "050", full_name: "Đặng Gia Bảo", birth_date: "2006-07-29", relationship_to_head: "Con", current_status: "Tạm vắng" },
      { room_number: "101", full_name: "=HYPERLINK(\"https://example.com\")", birth_date: "2000-01-01", relationship_to_head: "Chủ hộ", current_status: "Tạm vắng" },
    ], []];
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await exportResidents("Tạm vắng"));
  const sheet = workbook.getWorksheet("Danh sách nhân khẩu");
  assert.equal(sheet.rowCount, 3);
  assert.deepEqual(sheet.getRow(1).values.slice(1), [
    "STT", "Căn hộ", "Họ và tên", "Ngày sinh", "Quan hệ với chủ hộ", "Trạng thái cư trú",
  ]);
  assert.deepEqual(sheet.getRow(2).values.slice(1), [
    1, "050", "Đặng Gia Bảo", new Date("2006-07-29T00:00:00.000Z"), "Con", "Tạm vắng",
  ]);
  assert.equal(sheet.getCell("D2").numFmt, "dd/mm/yyyy");
  assert.equal(sheet.getCell("C3").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("C3").formula, undefined);
});
