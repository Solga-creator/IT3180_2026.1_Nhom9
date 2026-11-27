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

test("US-001 Service: removeApartment xóa căn hộ trống và chặn xóa căn hộ đang có nhân khẩu", async (t) => {
  let residentCount = 2;
  let deleted = false;
  t.mock.method(pool, "query", async (sql, params) => {
    if (sql.includes("WHERE id = ?") && sql.includes("SELECT")) {
      if (params[0] === 99) return [[], []];
      return [[{ id: 1, room_number: "050", area: "60.00" }], []];
    }
    if (sql.includes("COUNT(*) AS n")) {
      return [[{ n: residentCount }], []];
    }
    if (sql.includes("DELETE FROM apartments")) {
      deleted = true;
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  });

  await assert.rejects(removeApartment("abc"), { statusCode: 400 });
  await assert.rejects(removeApartment(99), { statusCode: 404 });
  await assert.rejects(removeApartment(1), { statusCode: 400 });

  residentCount = 0;
  const room = await removeApartment(1);
  assert.equal(room, "050");
  assert.equal(deleted, true);
});
