import test from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import { pool } from "../config/database.js";
import { signToken } from "../middlewares/auth.js";

const mockBqtUser = {
  id: 2,
  username: "bqt_vi",
  full_name: "Lê Tuấn Vĩ",
  phone: "0912345678",
  role: "BQT",
};

test("US-002..004 & US-017 API: Chặn 401 khi gọi API cư dân hoặc sửa hồ sơ không có token", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const res1 = await fetch(`${baseUrl}/api/residents`);
    assert.equal(res1.status, 401);

    const res2 = await fetch(`${baseUrl}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Tên Mới", phone: "0900000000" }),
    });
    assert.equal(res2.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("US-002..004 API: Thêm chủ hộ, cập nhật tạm vắng và tìm kiếm theo số phòng 050", async (t) => {
  const token = signToken(mockBqtUser);
  let currentStatus = "Thường trú";
  const events = [];

  t.mock.method(pool, "query", async (sql) => {
    if (/FROM users\s+WHERE id = \?/i.test(sql)) return [[mockBqtUser], []];
    if (/FROM residents r/i.test(sql)) {
      return [[{
        id: 100,
        household_id: 10,
        apartment_id: 1,
        room_number: "050",
        full_name: "Nguyễn Văn A",
        birth_date: "1985-05-15",
        relationship_to_head: "Chủ hộ",
        current_status: currentStatus,
        status_start_date: events[0]?.start_date || null,
        status_end_date: events[0]?.end_date || null,
        created_at: new Date("2026-11-05T04:00:00Z"),
      }], []];
    }
    if (/FROM residency_events/i.test(sql)) return [events, []];
    return [[], []];
  });

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql, params) => {
      if (/FROM apartments/i.test(sql)) return [[{ id: 1 }], []];
      if (/FROM households/i.test(sql) && /SELECT/i.test(sql)) return [[], []];
      if (/INSERT INTO households/i.test(sql)) return [{ insertId: 10 }, []];
      if (/INSERT INTO residents/i.test(sql)) return [{ insertId: 100 }, []];
      if (/UPDATE households/i.test(sql)) return [{ affectedRows: 1 }, []];
      if (/SELECT\s+id,\s*household_id[\s\S]*FROM\s+residents/i.test(sql)) return [[{ id: 100, household_id: 10, status_start_date: null }], []];
      if (/INSERT INTO residency_events/i.test(sql)) {
        currentStatus = params[1];
        events.unshift({
          id: 1,
          resident_id: 100,
          status: params[1],
          start_date: params[2],
          end_date: params[3],
          created_at: new Date("2026-11-06T02:00:00Z"),
        });
        return [{ insertId: 1 }, []];
      }
      if (/UPDATE residents/i.test(sql)) return [{ affectedRows: 1 }, []];
      if (/FROM residents r/i.test(sql)) {
        return [[{
          id: 100,
          household_id: 10,
          apartment_id: 1,
          room_number: "050",
          full_name: "Nguyễn Văn A",
          birth_date: "1985-05-15",
          relationship_to_head: "Chủ hộ",
          current_status: currentStatus,
          status_start_date: events[0]?.start_date || null,
          status_end_date: events[0]?.end_date || null,
          created_at: new Date("2026-11-05T04:00:00Z"),
        }], []];
      }
      if (/FROM residency_events/i.test(sql)) return [events, []];
      return [[], []];
    },
  }));

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const createRes = await fetch(`${baseUrl}/api/residents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        apartmentId: 1,
        fullName: "Nguyễn Văn A",
        birthDate: "1985-05-15",
        relationship: "Chủ hộ",
      }),
    });
    assert.equal(createRes.status, 201);
    const createdBody = await createRes.json();
    assert.equal(createdBody.resident.fullName, "Nguyễn Văn A");
    assert.equal(createdBody.resident.roomNumber, "050");

    const eventRes = await fetch(`${baseUrl}/api/residents/100/residency-events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        status: "Tạm vắng",
        startDate: "2026-11-06",
        endDate: "2026-12-20",
      }),
    });
    assert.equal(eventRes.status, 201);
    const eventBody = await eventRes.json();
    assert.equal(eventBody.resident.currentStatus, "Tạm vắng");

    const searchRes = await fetch(`${baseUrl}/api/residents?search=050`, { headers });
    assert.equal(searchRes.status, 200);
    const searchBody = await searchRes.json();
    assert.equal(searchBody.residents.length, 1);
    assert.equal(searchBody.residents[0].currentStatus, "Tạm vắng");
    assert.equal(searchBody.residents[0].residencyHistory.length, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
