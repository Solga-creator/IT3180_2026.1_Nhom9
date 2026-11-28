import test from "node:test";
import assert from "node:assert/strict";
import { pool } from "../config/database.js";
import {
  addResident,
  editResident,
  getResidents,
  removeResident,
  updateResidencyStatus,
} from "../services/residentService.js";
import { resolveEffectiveResidencyStatus } from "../repositories/residentRepository.js";
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
      assert.match(sql, /WHERE \(a\.room_number LIKE \? OR r\.full_name LIKE \?\)/);
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
        status_end_date: "2026-12-20",
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
        end_date: "2026-12-20",
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

test("US-004 Service: Ghi biến động cư trú 'Tạm vắng' đang hiệu lực đồng bộ trạng thái và lịch sử", async (t) => {
  let eventInserted = false;
  let statusUpdated = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql, params) => {
      if (/SELECT id, household_id/i.test(sql)) return [[{ id: 100, household_id: 10, status_start_date: null }], []];
      if (/INSERT INTO residency_events/i.test(sql)) {
        assert.deepEqual(params, [100, "Tạm vắng", "2026-11-06", "2026-12-20", 2]);
        eventInserted = true;
        return [{ insertId: 7 }, []];
      }
      if (/UPDATE residents/i.test(sql)) {
        assert.deepEqual(params, ["Tạm vắng", "2026-11-06", "2026-12-20", 100]);
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
          status_end_date: "2026-12-20",
          created_at: new Date("2026-11-05T04:00:00Z"),
        }], []];
      }
      if (/FROM residency_events/i.test(sql)) {
        return [[{
          id: 7,
          resident_id: 100,
          status: "Tạm vắng",
          start_date: "2026-11-06",
          end_date: "2026-12-20",
          created_at: new Date("2026-11-06T02:00:00Z"),
        }], []];
      }
      return [[], []];
    },
  }));

  const updated = await updateResidencyStatus(
    100,
    { status: "Tạm vắng", startDate: "2026-11-06", endDate: "2026-12-20" },
    2,
  );

  assert.equal(eventInserted, true);
  assert.equal(statusUpdated, true);
  assert.equal(updated.currentStatus, "Tạm vắng");
  assert.equal(updated.residencyHistory.length, 1);
});

test("US-004 Service: Sự kiện tương lai không ghi đè sai current_status; sự kiện Chuyển đi không có ngày kết thúc tự thu hồi phiên cư dân", async (t) => {
  let residentUpdateCount = 0;
  let userTokenRevoked = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql) => {
      if (/SELECT id, household_id/i.test(sql)) {
        return [[{ id: 100, household_id: 10, status_start_date: "2026-11-01" }], []];
      }
      if (/INSERT INTO residency_events/i.test(sql)) {
        return [{ insertId: 8 }, []];
      }
      if (/UPDATE residents/i.test(sql)) {
        residentUpdateCount += 1;
        return [{ affectedRows: 1 }, []];
      }
      if (/UPDATE users[\s\S]*SET token_version/i.test(sql)) {
        userTokenRevoked = true;
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
          current_status: residentUpdateCount > 0 ? "Chuyển đi" : "Thường trú",
          status_start_date: "2026-11-01",
          status_end_date: null,
          created_at: new Date("2026-11-05T04:00:00Z"),
        }], []];
      }
      if (/FROM residency_events/i.test(sql)) return [[], []];
      return [[], []];
    },
  }));

  await updateResidencyStatus(
    100,
    { status: "Tạm vắng", startDate: "2099-01-01", endDate: "2099-01-15" },
    2,
  );
  assert.equal(residentUpdateCount, 0);

  await updateResidencyStatus(
    100,
    { status: "Chuyển đi", startDate: "2026-11-20", endDate: "" },
    2,
  );
  assert.equal(residentUpdateCount, 1);
  assert.equal(userTokenRevoked, true);
});

test("US-002 Service: editResident cập nhật thông tin nhân khẩu và tự động chuyển quyền Chủ hộ", async (t) => {
  let oldHeadDemoted = false;
  let headUpdated = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql, params) => {
      if (/SELECT id, household_id, relationship_to_head/i.test(sql)) {
        return [[{ id: 101, household_id: 10, relationship_to_head: "Vợ/chồng" }], []];
      }
      if (/SELECT id, head_resident_id/i.test(sql)) {
        return [[{ id: 10, head_resident_id: 100 }], []];
      }
      if (/SET relationship_to_head = 'Khác'/i.test(sql)) {
        assert.equal(params[0], 100);
        oldHeadDemoted = true;
        return [{ affectedRows: 1 }, []];
      }
      if (/UPDATE households\s+SET head_resident_id = \?/i.test(sql)) {
        assert.deepEqual(params, [101, 10]);
        headUpdated = true;
        return [{ affectedRows: 1 }, []];
      }
      if (/UPDATE residents\s+SET full_name = \?/i.test(sql)) {
        return [{ affectedRows: 1 }, []];
      }
      if (/FROM residents r/i.test(sql)) {
        return [[{
          id: 101,
          household_id: 10,
          apartment_id: 1,
          room_number: "050",
          full_name: "Trần Thị Bình",
          birth_date: "1988-09-20",
          cccd: "001188023456",
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

  const updated = await editResident(101, {
    fullName: "Trần Thị Bình",
    birthDate: "1988-09-20",
    cccd: "001188023456",
    relationship: "Chủ hộ",
  });

  assert.equal(oldHeadDemoted, true);
  assert.equal(headUpdated, true);
  assert.equal(updated.relationship, "Chủ hộ");
  assert.equal(updated.cccd, "001188023456");
});

test("US-002 Service: removeResident chặn xóa Chủ hộ khi còn thành viên và cho phép xóa thành viên hoặc hộ 1 người", async (t) => {
  let memberCount = 2;
  let relationship = "Chủ hộ";
  let deleted = false;

  t.mock.method(pool, "getConnection", async () => ({
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release: () => {},
    query: async (sql) => {
      if (/SELECT id, household_id, full_name, relationship_to_head/i.test(sql)) {
        return [[{ id: 100, household_id: 10, full_name: "Nguyễn Văn A", relationship_to_head: relationship }], []];
      }
      if (/SELECT id, head_resident_id/i.test(sql)) {
        return [[{ id: 10, head_resident_id: 100 }], []];
      }
      if (/SELECT COUNT\(\*\) AS n/i.test(sql)) {
        return [[{ n: memberCount }], []];
      }
      if (/DELETE FROM residents/i.test(sql)) {
        deleted = true;
        return [{ affectedRows: 1 }, []];
      }
      return [[], []];
    },
  }));

  await assert.rejects(removeResident(100), { statusCode: 400 });

  memberCount = 1;
  const name = await removeResident(100);
  assert.equal(name, "Nguyễn Văn A");
  assert.equal(deleted, true);
});

test("US-003 & US-004 Service: Tự động áp dụng sự kiện cư trú khi đến hạn, khôi phục khi hết hạn và trả kèm householdHeadName khi lọc theo apartmentId", async (t) => {
  const scheduledEvents = [
    {
      id: 2,
      status: "Tạm vắng",
      start_date: "2026-12-01",
      end_date: "2026-12-10",
    },
  ];
  const baseRow = {
    current_status: "Thường trú",
    status_start_date: null,
    status_end_date: null,
  };

  assert.equal(
    resolveEffectiveResidencyStatus(baseRow, scheduledEvents, "2026-11-28").currentStatus,
    "Thường trú",
  );
  assert.equal(
    resolveEffectiveResidencyStatus(baseRow, scheduledEvents, "2026-12-05").currentStatus,
    "Tạm vắng",
  );
  assert.equal(
    resolveEffectiveResidencyStatus(baseRow, scheduledEvents, "2026-12-15").currentStatus,
    "Thường trú",
  );

  t.mock.method(pool, "query", async (sql, params) => {
    if (/FROM residents r/i.test(sql)) {
      assert.match(sql, /WHERE a\.id = \?/);
      assert.deepEqual(params, [2]);
      return [[{
        id: 102,
        household_id: 20,
        apartment_id: 2,
        head_resident_id: 101,
        head_full_name: "Lê Văn Chủ Hộ",
        room_number: "101",
        full_name: "Lê Thị Thành Viên",
        birth_date: "2001-03-12",
        relationship_to_head: "Con",
        current_status: "Thường trú",
        status_start_date: null,
        status_end_date: null,
        created_at: new Date("2026-11-05T04:00:00Z"),
      }], []];
    }
    if (/FROM residency_events/i.test(sql)) return [[], []];
    return [[], []];
  });

  const filtered = await getResidents("", { apartmentId: 2 });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].roomNumber, "101");
  assert.equal(filtered[0].householdHeadName, "Lê Văn Chủ Hộ");
});

test("US-004 Service: Ghi bù Chuyển đi trước start_date của sự kiện đã hết hạn vẫn thu hồi token trong cùng transaction và rollback khi lỗi", async (t) => {
  // 2026-11-27T18:00:00Z = 2026-11-28 VN
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });

  let residentRow = {
    id: 100,
    household_id: 10,
    apartment_id: 1,
    room_number: "050",
    full_name: "Nguyễn Văn A",
    birth_date: "1985-05-15",
    relationship_to_head: "Chủ hộ",
    current_status: "Tạm vắng",
    status_start_date: "2026-11-15",
    status_end_date: "2026-11-20",
    created_at: new Date("2026-11-05T04:00:00Z"),
  };
  let events = [
    {
      id: 1,
      resident_id: 100,
      status: "Tạm vắng",
      start_date: "2026-11-15",
      end_date: "2026-11-20",
      created_at: new Date("2026-11-15T00:00:00Z"),
    },
  ];
  let tokenRevokeCalls = 0;
  let failTokenUpdate = false;
  let committed = 0;
  let rolledBack = 0;
  let released = 0;

  t.mock.method(pool, "query", async () => {
    assert.fail("createResidencyEvent must use transaction connection, not pool.query");
  });

  t.mock.method(pool, "getConnection", async () => {
    let txRow = { ...residentRow };
    let txEvents = [...events];
    return {
      beginTransaction: async () => {},
      commit: async () => {
        residentRow = txRow;
        events = txEvents;
        committed += 1;
      },
      rollback: async () => {
        rolledBack += 1;
      },
      release: () => {
        released += 1;
      },
      query: async (sql, params = []) => {
        if (/FOR UPDATE/i.test(sql) && /FROM residents/i.test(sql)) {
          return [[{ ...txRow }], []];
        }
        if (/INSERT INTO residency_events/i.test(sql)) {
          const nextId = txEvents.length + 1;
          txEvents = [
            ...txEvents,
            {
              id: nextId,
              resident_id: params[0],
              status: params[1],
              start_date: params[2],
              end_date: params[3],
              created_at: new Date("2026-11-28T00:00:00Z"),
            },
          ].sort(
            (a, b) =>
              String(b.start_date).localeCompare(String(a.start_date)) ||
              b.id - a.id,
          );
          return [{ insertId: nextId }, []];
        }
        if (/UPDATE residents/i.test(sql)) {
          txRow = {
            ...txRow,
            current_status: params[0],
            status_start_date: params[1],
            status_end_date: params[2],
          };
          return [{ affectedRows: 1 }, []];
        }
        if (/UPDATE users[\s\S]*SET token_version/i.test(sql)) {
          if (failTokenUpdate) {
            throw new Error("DB error updating token_version");
          }
          tokenRevokeCalls += 1;
          return [{ affectedRows: 1 }, []];
        }
        if (/FROM residency_events/i.test(sql)) {
          return [[...txEvents], []];
        }
        if (/FROM residents r/i.test(sql)) {
          return [[{ ...txRow }], []];
        }
        return [[], []];
      },
    };
  });

  // 1. Backdated Chuyển đi (10/11, no endDate) overrides expired Tạm vắng (15-20/11) -> becomes Chuyển đi & revokes token
  const res1 = await updateResidencyStatus(
    100,
    { status: "Chuyển đi", startDate: "2026-11-10", endDate: "" },
    2,
  );
  assert.equal(res1.currentStatus, "Chuyển đi");
  assert.equal(tokenRevokeCalls, 1);
  assert.equal(committed, 1);

  // 2. Superseded Chuyển đi (when a newer Chuyển đến 25/11 is active) must NOT revoke token
  residentRow = {
    ...residentRow,
    current_status: "Chuyển đến",
    status_start_date: "2026-11-25",
    status_end_date: null,
  };
  events = [
    {
      id: 10,
      resident_id: 100,
      status: "Chuyển đến",
      start_date: "2026-11-25",
      end_date: null,
      created_at: new Date("2026-11-25T00:00:00Z"),
    },
  ];
  tokenRevokeCalls = 0;

  const res2 = await updateResidencyStatus(
    100,
    { status: "Chuyển đi", startDate: "2026-11-01", endDate: "2026-11-10" },
    2,
  );
  assert.equal(res2.currentStatus, "Chuyển đến");
  assert.equal(tokenRevokeCalls, 0);

  // 3. Future Chuyển đi (29/11) must NOT revoke token early
  const res3 = await updateResidencyStatus(
    100,
    { status: "Chuyển đi", startDate: "2026-11-29", endDate: "" },
    2,
  );
  assert.equal(res3.currentStatus, "Chuyển đến");
  assert.equal(tokenRevokeCalls, 0);

  // 4. Failure on UPDATE token_version rolls back the event and resident status update
  failTokenUpdate = true;
  const beforeCount = events.length;
  await assert.rejects(
    updateResidencyStatus(
      100,
      { status: "Chuyển đi", startDate: "2026-11-28", endDate: "" },
      2,
    ),
    /DB error updating token_version/,
  );
  assert.equal(rolledBack, 1);
  assert.equal(events.length, beforeCount);
  assert.equal(residentRow.current_status, "Chuyển đến");
  assert.equal(released, 4);
});
