import test from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import { pool } from "../config/database.js";
import { signToken } from "../middlewares/auth.js";

const mockBqtUser = {
  id: 2,
  username: "bqt_demo",
  full_name: "Thành viên BQT Demo",
  role: "BQT",
};

test("US-001 API: Chặn 401 khi chưa đăng nhập (không có token)", async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/apartments`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Chưa đăng nhập/);
  } finally {
    server.close();
  }
});

test("US-001 API: Thành viên BQT đăng nhập có thể lưu căn hộ '050' (60 m²) và hiển thị danh mục", async (t) => {
  const token = signToken(mockBqtUser);

  t.mock.method(pool, "query", async (sql, params) => {
    if (/from\s+users\s+where\s+id\s*=\s*\?/i.test(sql)) {
      return [[mockBqtUser], []];
    }
    if (/where\s+room_number\s*=\s*\?/i.test(sql)) {
      return [[], []];
    }
    if (/insert\s+into\s+apartments/i.test(sql)) {
      assert.equal(params[0], "050");
      assert.equal(params[1], 60);
      return [{ insertId: 50 }, []];
    }
    if (/from\s+apartments\s+where\s+id\s*=\s*\?/i.test(sql)) {
      return [
        [
          {
            id: 50,
            room_number: "050",
            area: "60.00",
            created_at: new Date("2026-11-05T03:00:00Z"),
            updated_at: new Date("2026-11-05T03:00:00Z"),
          },
        ],
        [],
      ];
    }
    if (/from\s+apartments/i.test(sql)) {
      return [
        [
          {
            id: 50,
            room_number: "050",
            area: "60.00",
            created_at: new Date("2026-11-05T03:00:00Z"),
            updated_at: new Date("2026-11-05T03:00:00Z"),
          },
        ],
        [],
      ];
    }
    return [[], []];
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const postRes = await fetch(`${baseUrl}/api/apartments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomNumber: "050",
        area: 60,
      }),
    });

    assert.equal(postRes.status, 201);
    const postData = await postRes.json();
    assert.equal(postData.success, true);
    assert.equal(postData.apartment.roomNumber, "050");
    assert.equal(postData.apartment.area, 60);

    const getRes = await fetch(`${baseUrl}/api/apartments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.equal(getData.apartments.length, 1);
    assert.equal(getData.apartments[0].roomNumber, "050");
    assert.equal(getData.apartments[0].area, 60);
  } finally {
    server.close();
  }
});

test("US-001 API: Trả lỗi 409 khi lưu trùng số phòng", async (t) => {
  const token = signToken(mockBqtUser);

  t.mock.method(pool, "query", async (sql) => {
    if (/from\s+users\s+where\s+id\s*=\s*\?/i.test(sql)) {
      return [[mockBqtUser], []];
    }
    if (/where\s+room_number\s*=\s*\?/i.test(sql)) {
      return [
        [
          {
            id: 1,
            room_number: "050",
            area: "60.00",
            created_at: new Date(),
          },
        ],
        [],
      ];
    }
    return [[], []];
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const res = await fetch(`${baseUrl}/api/apartments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomNumber: "050",
        area: 60,
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /đã tồn tại/);
  } finally {
    server.close();
  }
});
