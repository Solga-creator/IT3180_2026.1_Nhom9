import test from "node:test";
import assert from "node:assert/strict";
import { pool } from "../config/database.js";
import {
  editApartment,
  getApartments,
  removeApartment,
  saveApartment,
} from "../services/apartmentService.js";
import { AppError } from "../helpers/AppError.js";

test("US-001 Service: Ném AppError 400 khi số phòng rỗng hoặc diện tích không hợp lệ", async () => {
  await assert.rejects(
    async () => {
      await saveApartment({ roomNumber: "", area: 60 });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, "Số phòng là bắt buộc.");
      return true;
    },
  );

  await assert.rejects(
    async () => {
      await saveApartment({ roomNumber: "050", area: -10 });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, "Diện tích căn hộ phải lớn hơn 0 m².");
      return true;
    },
  );
});

test("US-001 Service: Ném AppError 409 khi số phòng đã tồn tại trong danh mục", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    if (sql.includes("WHERE room_number = ?")) {
      assert.equal(params[0], "050");
      return [
        [
          {
            id: 1,
            room_number: "050",
            area: "60.00",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        [],
      ];
    }
    return [[], []];
  });

  await assert.rejects(
    async () => {
      await saveApartment({ roomNumber: "050", area: 60 });
    },
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 409);
      assert.equal(
        err.message,
        'Số phòng "050" đã tồn tại trong danh mục.',
      );
      return true;
    },
  );
});

test("US-001 Service: Lưu căn hộ mẫu số phòng '050' với diện tích '60' m² thành công", async (t) => {
  let inserted = false;

  t.mock.method(pool, "query", async (sql, params) => {
    if (sql.includes("WHERE room_number = ?")) {
      return [[], []]; // Chưa có căn hộ nào trùng
    }
    if (sql.includes("INSERT INTO apartments")) {
      assert.equal(params[0], "050");
      assert.equal(params[1], 60);
      inserted = true;
      return [{ insertId: 42 }, []];
    }
    if (sql.includes("WHERE id = ?")) {
      assert.equal(params[0], 42);
      return [
        [
          {
            id: 42,
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

  const apt = await saveApartment({
    roomNumber: "  050  ",
    area: "60",
  });

  assert.equal(inserted, true);
  assert.equal(apt.id, 42);
  assert.equal(apt.roomNumber, "050");
  assert.equal(apt.area, 60);
});

test("US-001 Service: getApartments trả về danh mục căn hộ sắp xếp chuẩn và parse diện tích", async (t) => {
  t.mock.method(pool, "query", async (sql) => {
    if (sql.includes("FROM apartments")) {
      return [
        [
          {
            id: 1,
            room_number: "050",
            area: "60.00",
            created_at: new Date("2026-11-05T01:00:00Z"),
            updated_at: new Date("2026-11-05T01:00:00Z"),
          },
          {
            id: 2,
            room_number: "101",
            area: "75.50",
            created_at: new Date("2026-11-05T02:00:00Z"),
            updated_at: new Date("2026-11-05T02:00:00Z"),
          },
        ],
        [],
      ];
    }
    return [[], []];
  });

  const list = await getApartments();
  assert.equal(list.length, 2);
  assert.equal(list[0].roomNumber, "050");
  assert.equal(list[0].area, 60);
  assert.equal(list[1].roomNumber, "101");
  assert.equal(list[1].area, 75.5);
});

test("US-001 Service: editApartment cập nhật diện tích/số phòng và chặn trùng số phòng", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    if (sql.includes("WHERE id = ?") && sql.includes("SELECT")) {
      if (params[0] === 99) return [[], []];
      return [[{ id: 1, room_number: "050", area: "64.50", created_at: new Date(), updated_at: new Date() }], []];
    }
    if (sql.includes("WHERE room_number = ?")) {
      if (params[0] === "101") return [[{ id: 2, room_number: "101", area: "75.00" }], []];
      return [[], []];
    }
    if (sql.includes("UPDATE apartments")) {
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  });

  await assert.rejects(editApartment("abc", { roomNumber: "050", area: 64.5 }), { statusCode: 400 });
  await assert.rejects(editApartment(99, { roomNumber: "050", area: 64.5 }), { statusCode: 404 });
  await assert.rejects(editApartment(1, { roomNumber: "101", area: 64.5 }), { statusCode: 409 });

  const updated = await editApartment(1, { roomNumber: "050", area: 64.5 });
  assert.equal(updated.id, 1);
  assert.equal(updated.area, 64.5);
});

test("US-001 Service: removeApartment khóa dòng FOR UPDATE, đếm nhân khẩu và xóa căn hộ trống trong cùng transaction", async (t) => {
  let residentCount = 2;
  let failDelete = false;
  const steps = [];
  let committed = 0;
  let rolledBack = 0;
  let released = 0;

  t.mock.method(pool, "query", async () => {
    assert.fail("removeApartment must use transaction connection, not pool.query");
  });

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {
      steps.push("BEGIN");
    },
    commit: async () => {
      steps.push("COMMIT");
      committed += 1;
    },
    rollback: async () => {
      steps.push("ROLLBACK");
      rolledBack += 1;
    },
    release: () => {
      steps.push("RELEASE");
      released += 1;
    },
    query: async (sql, params) => {
      if (/FROM apartments[\s\S]*WHERE id = \?[\s\S]*FOR UPDATE/i.test(sql)) {
        steps.push(`LOCK:${params[0]}`);
        if (params[0] === 99) return [[], []];
        return [[{ id: 1, room_number: "050", area: "60.00" }], []];
      }
      if (/COUNT\(\*\) AS n/i.test(sql)) {
        steps.push(`COUNT:${params[0]}`);
        return [[{ n: residentCount }], []];
      }
      if (/DELETE FROM apartments/i.test(sql)) {
        steps.push(`DELETE:${params[0]}`);
        if (failDelete) throw new Error("DB delete failure");
        return [{ affectedRows: 1 }, []];
      }
      return [[], []];
    },
  }));

  await assert.rejects(removeApartment("abc"), { statusCode: 400 });
  assert.equal(steps.length, 0);

  // 1. Not found -> locks, rolls back, releases without counting or deleting
  await assert.rejects(removeApartment(99), { statusCode: 404 });
  assert.deepEqual(steps, ["BEGIN", "LOCK:99", "ROLLBACK", "RELEASE"]);

  // 2. Has residents -> locks, counts, rolls back, releases without deleting
  steps.length = 0;
  await assert.rejects(removeApartment(1), { statusCode: 400 });
  assert.deepEqual(steps, ["BEGIN", "LOCK:1", "COUNT:1", "ROLLBACK", "RELEASE"]);

  // 3. Error during delete -> rolls back and releases
  steps.length = 0;
  residentCount = 0;
  failDelete = true;
  await assert.rejects(removeApartment(1), /DB delete failure/);
  assert.deepEqual(steps, ["BEGIN", "LOCK:1", "COUNT:1", "DELETE:1", "ROLLBACK", "RELEASE"]);
  assert.equal(rolledBack, 3);

  // 4. Empty apartment -> locks, counts, deletes, commits, releases
  steps.length = 0;
  failDelete = false;
  const room = await removeApartment(1);
  assert.equal(room, "050");
  assert.deepEqual(steps, ["BEGIN", "LOCK:1", "COUNT:1", "DELETE:1", "COMMIT", "RELEASE"]);
  assert.equal(committed, 1);
  assert.equal(released, 4);
});
