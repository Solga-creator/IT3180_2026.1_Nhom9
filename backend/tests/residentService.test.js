import test from "node:test";
import assert from "node:assert/strict";
import { pool } from "../config/database.js";
import {
  addResident,
  getResidents,
  updateResidencyStatus,
} from "../services/residentService.js";
import { AppError } from "../helpers/AppError.js";

test("US-002 Service: Chặn 400 khi căn hộ chưa có chủ hộ mà thêm quan hệ 'Con'", async (t) => {
  let rolledBack = false;
  let released = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => { rolledBack = true; },
    commit: async () => {},
    release: () => { released = true; },
    query: async (sql) => {
      if (/FROM apartments/i.test(sql)) return [[{ id: 1 }], []];
      if (/FROM households/i.test(sql)) return [[], []];
      return [[], []];
    },
  }));

  await assert.rejects(
    addResident({
      apartmentId: 1,
      fullName: "Nguyễn Văn Con",
      birthDate: "2015-05-10",
      relationship: "Con",
    }),
    (err) => {
      assert(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, "Hãy thêm chủ hộ trước khi thêm nhân khẩu.");
      return true;
    },
  );
  assert.equal(rolledBack, true);
  assert.equal(released, true);
});

test("US-002 Service: Chặn 409 khi căn hộ đã có chủ hộ mà thêm chủ hộ thứ hai", async (t) => {
  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql) => {
      if (/FROM apartments/i.test(sql)) return [[{ id: 1 }], []];
      if (/FROM households/i.test(sql)) return [[{ id: 10, head_resident_id: 5 }], []];
      return [[], []];
    },
  }));

  await assert.rejects(
    addResident({
      apartmentId: 1,
      fullName: "Chủ Hộ Thứ Hai",
      birthDate: "1980-01-01",
      relationship: "Chủ hộ",
    }),
    {
      statusCode: 409,
      message: "Căn hộ này đã có chủ hộ.",
    },
  );
});

test("US-002 Service: Tạo chủ hộ Nguyễn Văn A cho căn 050 thành công", async (t) => {
  let committed = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => { committed = true; },
    release: () => {},
    query: async (sql) => {
      if (/FROM apartments/i.test(sql)) return [[{ id: 1 }], []];
      if (/FROM households/i.test(sql) && /SELECT/i.test(sql)) return [[], []];
      if (/INSERT INTO households/i.test(sql)) return [{ insertId: 10 }, []];
      if (/INSERT INTO residents/i.test(sql)) return [{ insertId: 100 }, []];
      if (/UPDATE households/i.test(sql)) return [{ affectedRows: 1 }, []];
      if (/FROM residents r/i.test(sql)) {
        return [[{
          id: 100,
          household_id: 10,
          apartment_id: 1,
          room_number: "050",
          full_name: "Nguyễn Văn A",
          birth_date: "1985-05-15",
          relationship_to_head: "Chủ hộ",
          current_status: "Thường trú",
          status_start_date: null,
          status_end_date: null,
          created_at: new Date("2026-11-05T04:00:00Z"),
        }], []];
      }
      if (/FROM residency_events/i.test(sql)) return [[], []];
      return [[], []];
    },
  }));

  const resident = await addResident({
    apartmentId: 1,
    fullName: "Nguyễn Văn A",
    birthDate: "1985-05-15",
    relationship: "Chủ hộ",
  });

  assert.equal(committed, true);
  assert.equal(resident.id, 100);
  assert.equal(resident.roomNumber, "050");
  assert.equal(resident.fullName, "Nguyễn Văn A");
  assert.equal(resident.relationship, "Chủ hộ");
  assert.equal(resident.currentStatus, "Thường trú");
});

test("US-003 Service: Tìm kiếm nhân khẩu theo số phòng hoặc họ tên kèm lịch sử", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    if (/FROM residents r/i.test(sql)) {
      assert.match(sql, /WHERE a\.room_number LIKE \? OR r\.full_name LIKE \?/);
      assert.deepEqual(params, ["%050%", "%050%"]);
      return [[{
        id: 100,
        household_id: 10,
        apartment_id: 1,
        room_number: "050",
        full_name: "Nguyễn Văn A",
        birth_date: "1985-05-15",
        relationship_to_head: "Chủ hộ",
        current_status: "Tạm vắng",
        status_start_date: "2026-11-06",
        status_end_date: "2026-11-20",
        created_at: new Date("2026-11-05T04:00:00Z"),
      }], []];
    }
    if (/FROM residency_events/i.test(sql)) {
      assert.deepEqual(params, [100]);
      return [[{
        id: 1,
        resident_id: 100,
        status: "Tạm vắng",
        start_date: "2026-11-06",
        end_date: "2026-11-20",
        created_at: new Date("2026-11-06T01:00:00Z"),
      }], []];
    }
    return [[], []];
  });

  const residents = await getResidents("050");
  assert.equal(residents.length, 1);
  assert.equal(residents[0].roomNumber, "050");
  assert.equal(residents[0].currentStatus, "Tạm vắng");
  assert.equal(residents[0].residencyHistory.length, 1);
  assert.equal(residents[0].residencyHistory[0].status, "Tạm vắng");
});

test("US-004 Service: Ghi biến động cư trú 'Tạm vắng' đồng bộ trạng thái và lịch sử", async (t) => {
  let eventInserted = false;
  let statusUpdated = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql, params) => {
      if (/SELECT id, household_id/i.test(sql)) return [[{ id: 100, household_id: 10 }], []];
      if (/INSERT INTO residency_events/i.test(sql)) {
        assert.deepEqual(params, [100, "Tạm vắng", "2026-11-06", "2026-11-20", 2]);
        eventInserted = true;
        return [{ insertId: 7 }, []];
      }
      if (/UPDATE residents/i.test(sql)) {
        assert.deepEqual(params, ["Tạm vắng", "2026-11-06", "2026-11-20", 100]);
        statusUpdated = true;
        return [{ affectedRows: 1 }, []];
      }
      if (/FROM residents r/i.test(sql)) {
        return [[{
          id: 100,
          household_id: 10,
          apartment_id: 1,
          room_number: "050",
          full_name: "Nguyễn Văn A",
          birth_date: "1985-05-15",
          relationship_to_head: "Chủ hộ",
          current_status: "Tạm vắng",
          status_start_date: "2026-11-06",
          status_end_date: "2026-11-20",
          created_at: new Date("2026-11-05T04:00:00Z"),
        }], []];
      }
      if (/FROM residency_events/i.test(sql)) {
        return [[{
          id: 7,
          resident_id: 100,
          status: "Tạm vắng",
          start_date: "2026-11-06",
          end_date: "2026-11-20",
          created_at: new Date("2026-11-06T02:00:00Z"),
        }], []];
      }
      return [[], []];
    },
  }));

  const updated = await updateResidencyStatus(
    100,
    { status: "Tạm vắng", startDate: "2026-11-06", endDate: "2026-11-20" },
    2,
  );

  assert.equal(eventInserted, true);
  assert.equal(statusUpdated, true);
  assert.equal(updated.currentStatus, "Tạm vắng");
  assert.equal(updated.residencyHistory.length, 1);
});
