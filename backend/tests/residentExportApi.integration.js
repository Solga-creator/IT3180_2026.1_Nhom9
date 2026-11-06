import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import app from "../app.js";
import { pool } from "../config/database.js";
import { signToken } from "../middlewares/auth.js";
import { RESIDENCY_STATUSES } from "../validators/residentValidation.js";

const user = { id: 2, username: "bqt_export", full_name: "BQT", role: "BQT" };

async function withServer(run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("US-005 API: chặn yêu cầu không có token hoặc token sai", async () => {
  await withServer(async (base) => {
    for (const headers of [{}, { Authorization: "Bearer invalid" }]) {
      const response = await fetch(`${base}/api/residents/export?status=${encodeURIComponent("Tạm trú")}`, { headers });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).success, false);
    }
  });
});

test("US-005 API: BQT tải Excel theo từng trạng thái hiện tại và nhận lỗi JSON phù hợp", async (t) => {
  let empty = false;
  const fixtures = RESIDENCY_STATUSES.map((status, index) => ({
    room_number: `00${index + 1}`,
    full_name: `Cư dân ${index + 1}`,
    birth_date: "2000-01-01",
    relationship_to_head: "Chủ hộ",
    current_status: status,
  }));
  t.mock.method(pool, "query", async (sql, params) => {
    if (/FROM users\s+WHERE id = \?/i.test(sql)) return [[user], []];
    assert.match(sql, /WHERE r.current_status = \?/);
    assert.match(sql, /JOIN apartments/);
    return [empty ? [] : fixtures.filter((row) => row.current_status === params[0]), []];
  });
  const headers = { Authorization: `Bearer ${signToken(user)}` };
  await withServer(async (base) => {
    for (const status of RESIDENCY_STATUSES) {
      const response = await fetch(`${base}/api/residents/export?status=${encodeURIComponent(status)}`, { headers });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /spreadsheetml.sheet/);
      assert.match(response.headers.get("content-disposition"), /attachment;.*\.xlsx/);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
      const sheet = workbook.worksheets[0];
      assert.equal(sheet.rowCount, 2);
      assert.equal(sheet.getCell("F2").value, status);
      const expected = fixtures.find((row) => row.current_status === status);
      assert.equal(sheet.getCell("B2").value, expected.room_number);
      assert.equal(sheet.getCell("C2").value, expected.full_name);
    }
    for (const query of ["", "?status=sai", "?status=a&status=b"]) {
      const response = await fetch(`${base}/api/residents/export${query}`, { headers });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).success, false);
    }
    empty = true;
    const response = await fetch(`${base}/api/residents/export?status=${encodeURIComponent("Tạm trú")}`, { headers });
    assert.equal(response.status, 404);
    assert.match((await response.json()).message, /Không có nhân khẩu/);
  });
});
