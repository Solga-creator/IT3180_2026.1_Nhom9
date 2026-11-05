import test from "node:test";
import assert from "node:assert/strict";
import { pool } from "../config/database.js";
import {
  createApartment,
  getApartments,
} from "../api/handlers/apartmentHandlers.js";

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test("US-001 Handler: createApartment trả về 201 cùng dữ liệu căn hộ '050' (60 m²)", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    if (sql.includes("WHERE room_number = ?")) {
      return [[], []];
    }
    if (sql.includes("INSERT INTO apartments")) {
      assert.equal(params[0], "050");
      assert.equal(params[1], 60);
      return [{ insertId: 50 }, []];
    }
    if (sql.includes("WHERE id = ?")) {
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

  const req = {
    body: {
      roomNumber: "050",
      area: 60,
    },
  };
  const res = createMockResponse();

  await createApartment(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.apartment.roomNumber, "050");
  assert.equal(res.body.apartment.area, 60);
});

test("US-001 Handler: getApartments trả về 200 cùng danh mục căn hộ", async (t) => {
  t.mock.method(pool, "query", async (sql) => {
    if (sql.includes("FROM apartments")) {
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

  const req = {};
  const res = createMockResponse();

  await getApartments(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(Array.isArray(res.body.apartments), true);
  assert.equal(res.body.apartments.length, 1);
  assert.equal(res.body.apartments[0].roomNumber, "050");
  assert.equal(res.body.apartments[0].area, 60);
});
