import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { pool } from "../config/database.js";
import {
  validateProfile,
  validatePasswordChange,
} from "../validators/authValidation.js";
import { validateAccountIssue } from "../validators/accountValidation.js";
import {
  login,
  saveProfile,
  changePassword,
} from "../services/authService.js";
import {
  issueAccount,
  getAccounts,
  removeAccount,
  resetStaffPassword,
} from "../services/accountService.js";
import {
  approveResidentAccount,
  getMyResidence,
  getResidentAccountOptions,
  issueResidentAccount,
  registerResidentAccount,
} from "../services/residentAccountService.js";
import { getEffectiveResidencyStatuses } from "../repositories/residentRepository.js";
import {
  assertJwtConfigured,
  signToken,
  requireAuth,
  requireAdmin,
} from "../middlewares/auth.js";

test("US-015 Validation: Kiểm tra dữ liệu cấp tài khoản BQT hợp lệ", () => {
  assert.equal(validateAccountIssue("ketoan01", "Trần Kế Toán", "123456"), null);
  assert.equal(validateAccountIssue("bqt.thu_quy-02", "Lê Thủ Quỹ", "matkhau99"), null);
});

test("US-015 Validation: Từ chối username quá ngắn, chứa khoảng trắng hoặc ký tự đặc biệt", () => {
  assert.equal(
    validateAccountIssue("ab", "Trần Kế Toán", "123456"),
    "Tên đăng nhập từ 3 ký tự, không dấu cách.",
  );
  assert.equal(
    validateAccountIssue("ke toan", "Trần Kế Toán", "123456"),
    "Tên đăng nhập từ 3 ký tự, không dấu cách.",
  );
  assert.equal(
    validateAccountIssue("ketoan@01", "Trần Kế Toán", "123456"),
    "Tên đăng nhập từ 3 ký tự, không dấu cách.",
  );
});

test("US-015 Validation: Từ chối họ tên rỗng hoặc mật khẩu khởi tạo dưới 6 ký tự", () => {
  assert.equal(
    validateAccountIssue("ketoan01", "A", "123456"),
    "Nhập họ tên thành viên BQT.",
  );
  assert.equal(
    validateAccountIssue("ketoan01", "Trần Kế Toán", "123"),
    "Mật khẩu khởi tạo tối thiểu 6 ký tự.",
  );
});

test("US-015 Service: Cấp tài khoản mới và lấy danh sách tài khoản thành công", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    if (/WHERE username = \?/i.test(sql)) {
      if (params[0] === "admin") return [[{ id: 1, username: "admin" }], []];
      return [[], []];
    }
    if (/INSERT INTO users/i.test(sql)) return [{ insertId: 9 }, []];
    if (/FROM users[\s\S]*ORDER BY id ASC/i.test(sql)) {
      return [[
        { id: 1, username: "admin", full_name: "Quản trị viên", role: "ADMIN", created_at: new Date("2026-11-04T00:00:00Z") },
        { id: 9, username: "ketoan01", full_name: "Trần Kế Toán", role: "BQT", created_at: new Date("2026-11-04T01:00:00Z") },
      ], []];
    }
    return [[], []];
  });

  await assert.rejects(
    issueAccount({ username: "admin", fullName: "Quản trị", password: "password123" }),
    { statusCode: 409, message: "Tên đăng nhập đã được cấp." },
  );

  const created = await issueAccount({
    username: "ketoan01",
    fullName: "Trần Kế Toán",
    password: "password123",
  });
  assert.equal(created.id, 9);
  assert.equal(created.username, "ketoan01");
  assert.equal(created.role, "BQT");

  const list = await getAccounts();
  assert.equal(list.length, 2);
  assert.equal(list[1].fullName, "Trần Kế Toán");
});

test("US-015 Service: Chặn xóa tài khoản không tồn tại, đang đăng nhập hoặc ADMIN cuối cùng", async (t) => {
  t.mock.method(pool, "query", async (sql, params) => {
    if (/WHERE id = \?/i.test(sql)) {
      if (params[0] === 999) return [[], []];
      if (params[0] === 1) return [[{ id: 1, username: "admin", role: "ADMIN" }], []];
      if (params[0] === 2) return [[{ id: 2, username: "admin2", role: "ADMIN" }], []];
    }
    if (/COUNT\(\*\) AS n/i.test(sql)) return [[{ n: 1 }], []];
    return [[], []];
  });

  await assert.rejects(removeAccount("abc", 1), { statusCode: 400, message: "Tài khoản không hợp lệ." });
  await assert.rejects(removeAccount(999, 1), { statusCode: 404, message: "Tài khoản không tồn tại." });
  await assert.rejects(removeAccount(1, 1), { statusCode: 400, message: "Không thể xóa tài khoản đang đăng nhập." });
  await assert.rejects(removeAccount(2, 1), { statusCode: 400, message: "Không thể xóa quản trị viên cuối cùng." });
});

test("US-016 Service: Đăng nhập trả JWT khi đúng mật khẩu và chặn 400/401 khi thiếu hoặc sai thông tin", async (t) => {
  const hash = await bcrypt.hash("matkhau123", 4);
  t.mock.method(pool, "query", async (sql, params) => {
    if (/WHERE username = \?/i.test(sql) && params[0] === "ketoan01") {
      return [[{
        id: 2,
        username: "ketoan01",
        full_name: "Trần Kế Toán",
        phone: "0912345678",
        password_hash: hash,
        role: "BQT",
      }], []];
    }
    return [[], []];
  });

  await assert.rejects(
    login("", ""),
    { statusCode: 400, message: "Nhập tên đăng nhập và mật khẩu." },
  );

  const result = await login("ketoan01", "matkhau123");
  assert.ok(result.token);
  assert.equal(result.user.username, "ketoan01");
  assert.equal(result.user.password_hash, undefined);

  await assert.rejects(
    login("ketoan01", "sai_mat_khau"),
    { statusCode: 401, message: "Tên đăng nhập hoặc mật khẩu không đúng." },
  );
});

test("US-016 Middleware: requireAuth và requireAdmin xác thực JWT và phân quyền chuẩn xác", async (t) => {
  t.mock.method(pool, "query", async () => [[{
    id: 2,
    username: "ketoan01",
    full_name: "Trần Kế Toán",
    phone: "0912345678",
    role: "BQT",
  }], []]);

  const token = signToken({ id: 2, username: "ketoan01", role: "BQT" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let nextCalled = false;
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };

  await requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 2);
  assert.equal(req.user.role, "BQT");

  let adminNext = false;
  requireAdmin(req, res, () => { adminNext = true; });
  assert.equal(adminNext, false);
  assert.equal(res.statusCode, 403);
});

test("US-017 Validation: Kiểm tra họ tên và số điện thoại hồ sơ cá nhân", () => {
  assert.equal(validateProfile("Lê Tuấn Vĩ", "0912 345 678"), null);
  assert.equal(validateProfile("Lê Tuấn Vĩ", "+84 (024) 3869-0000"), null);
  assert.equal(validateProfile("Lê Tuấn Vĩ", ""), null);
  assert.equal(validateProfile("A", "0912345678"), "Họ tên phải từ 2 đến 120 ký tự.");
  assert.equal(validateProfile("Lê Tuấn Vĩ", "0912abc"), "Số điện thoại không hợp lệ.");
  assert.equal(validateProfile("Lê Tuấn Vĩ", "1".repeat(31)), "Số điện thoại không hợp lệ.");
});

test("US-017 Validation: Kiểm tra điều kiện đổi mật khẩu", () => {
  assert.equal(validatePasswordChange("oldpass", "newpass123"), null);
  assert.equal(validatePasswordChange("", "newpass123"), "Nhập mật khẩu hiện tại và mật khẩu mới.");
  assert.equal(validatePasswordChange("oldpass", ""), "Nhập mật khẩu hiện tại và mật khẩu mới.");
  assert.equal(validatePasswordChange("oldpass", "12345"), "Mật khẩu mới tối thiểu 6 ký tự.");
});

test("US-017 Service: Sửa hồ sơ cá nhân theo userId từ JWT và bỏ qua trường lạ", async (t) => {
  let updatedProfile = null;
  t.mock.method(pool, "query", async (sql, params) => {
    if (/UPDATE users\s+SET full_name/i.test(sql)) {
      updatedProfile = { fullName: params[0], phone: params[1], id: params[2] };
      return [{ affectedRows: 1 }, []];
    }
    if (/SELECT \*\s+FROM users\s+WHERE id = \?/i.test(sql)) {
      return [[{
        id: params[0],
        username: "ketoan01",
        full_name: updatedProfile?.fullName || "Trần Kế Toán",
        phone: updatedProfile?.phone || "",
        role: "BQT",
      }], []];
    }
    return [[], []];
  });

  const user = await saveProfile(2, {
    id: 1,
    role: "ADMIN",
    fullName: "  Lê Tuấn Vĩ  ",
    phone: "0988777666",
  });
  assert.equal(user.id, 2);
  assert.equal(user.role, "BQT");
  assert.equal(user.fullName, "Lê Tuấn Vĩ");
  assert.equal(user.phone, "0988777666");
});

test("US-017 Service: Đổi mật khẩu thành công sau khi xác minh mật khẩu hiện tại bằng bcrypt", async (t) => {
  let savedHash = await bcrypt.hash("oldpass123", 4);

  t.mock.method(pool, "query", async (sql, params) => {
    if (/SELECT password_hash/i.test(sql)) {
      return [[{ password_hash: savedHash }], []];
    }
    if (/UPDATE users\s+SET password_hash/i.test(sql)) {
      savedHash = params[0];
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  });

  await assert.rejects(
    changePassword(2, { currentPassword: "wrong_password", newPassword: "newpassword123" }),
    { statusCode: 400, message: "Mật khẩu hiện tại không đúng." },
  );

  await changePassword(2, { currentPassword: "oldpass123", newPassword: "newpassword123" });
  assert.equal(await bcrypt.compare("newpassword123", savedHash), true);
});

test("US-016 Security: Khóa tạm tài khoản 5 phút sau 5 lần đăng nhập sai liên tiếp và chặn tài khoản PENDING", async (t) => {
  const hash = await bcrypt.hash("matkhau123", 4);
  let attempts = 4;
  let lockedUntil = null;
  let accountStatus = "ACTIVE";

  t.mock.method(pool, "query", async (sql) => {
    if (/WHERE username = \?/i.test(sql)) {
      return [[{
        id: 5,
        username: "cudan050",
        full_name: "Nguyễn Văn An",
        password_hash: hash,
        role: "RESIDENT",
        account_status: accountStatus,
        failed_login_attempts: attempts,
        locked_until: lockedUntil,
      }], []];
    }
    if (/SET failed_login_attempts = \?/i.test(sql)) {
      attempts += 1;
      lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  });

  await assert.rejects(
    login("cudan050", "sai_lan_5"),
    { statusCode: 423 },
  );

  await assert.rejects(
    login("cudan050", "matkhau123"),
    { statusCode: 423 },
  );

  lockedUntil = null;
  attempts = 0;
  accountStatus = "PENDING";
  await assert.rejects(
    login("cudan050", "matkhau123"),
    { statusCode: 403 },
  );
});

test("US-015 & Cư dân: Cư dân tự đăng ký tài khoản PENDING, BQT duyệt, che CCCD thành viên khác và chặn xem hộ khi đã Chuyển đi", async (t) => {
  let currentStatus = "PENDING";
  let residencyStatus = "Thường trú";
  t.mock.method(pool, "query", async (sql, params = []) => {
    if (/LOWER\(TRIM\(a\.room_number\)\)/i.test(sql)) {
      return [[{
        id: 100,
        full_name: "Nguyễn Văn An",
        relationship_to_head: "Chủ hộ",
        current_status: residencyStatus,
        room_number: "050",
      }], []];
    }
    if (/FROM residents\s+WHERE id IN/i.test(sql)) {
      const idSet = new Set(params.map(Number));
      return [
        idSet.has(100)
          ? [{ id: 100, current_status: residencyStatus, status_start_date: null, status_end_date: null }]
          : [],
        [],
      ];
    }
    if (/FROM residency_events\s+WHERE resident_id IN/i.test(sql)) return [[], []];
    if (/WHERE resident_id = \?/i.test(sql)) return [[], []];
    if (/WHERE username = \?/i.test(sql)) return [[], []];
    if (/INSERT INTO users/i.test(sql)) return [{ insertId: 15 }, []];
    if (/SELECT \*\s+FROM users\s+WHERE id = \?/i.test(sql)) {
      return [[{ id: 15, username: "cudan050", role: "RESIDENT", resident_id: 100, account_status: currentStatus }], []];
    }
    if (/SET account_status = \?/i.test(sql)) {
      currentStatus = "ACTIVE";
      return [{ affectedRows: 1 }, []];
    }
    if (/WHERE u\.id = \?\s+AND u\.role = 'RESIDENT'/i.test(sql)) {
      return [[{
        resident_id: 100,
        household_id: 10,
        full_name: "Nguyễn Văn An",
        birth_date: "1985-05-15",
        cccd: "001085012345",
        relationship_to_head: "Chủ hộ",
        current_status: residencyStatus,
        apartment_id: 1,
        room_number: "050",
        area: "60.00",
      }], []];
    }
    if (/WHERE r\.household_id = \?/i.test(sql) && /FROM residents r/i.test(sql)) {
      return [[
        {
          id: 100,
          full_name: "Nguyễn Văn An",
          birth_date: "1985-05-15",
          cccd: "001085012345",
          relationship_to_head: "Chủ hộ",
          current_status: "Thường trú",
          status_start_date: null,
          status_end_date: null,
        },
        {
          id: 101,
          full_name: "Trần Thị Bình",
          birth_date: "1988-09-20",
          cccd: "001188023456",
          relationship_to_head: "Vợ/chồng",
          current_status: "Thường trú",
          status_start_date: null,
          status_end_date: null,
        },
      ], []];
    }
    if (/FROM residency_events e/i.test(sql)) return [[], []];
    return [[], []];
  });

  const reg = await registerResidentAccount({
    roomNumber: "050",
    fullName: "Nguyễn Văn An",
    username: "cudan050",
    password: "password123",
  });
  assert.equal(reg.accountStatus, "PENDING");
  assert.equal(reg.roomNumber, "050");

  const approved = await approveResidentAccount(15);
  assert.equal(approved.accountStatus, "ACTIVE");

  const residence = await getMyResidence({ id: 15, role: "RESIDENT" });
  assert.equal(residence.roomNumber, "050");
  assert.equal(residence.area, 60);
  assert.equal(residence.members.length, 2);
  assert.equal(residence.members[0].cccd, "001085012345");
  assert.equal(residence.members[1].cccd, "********3456");

  residencyStatus = "Chuyển đi";
  await assert.rejects(
    getMyResidence({ id: 15, role: "RESIDENT" }),
    { statusCode: 403 },
  );
});

test("US-015 & US-016 Security: Yêu cầu JWT_SECRET, sinh mật khẩu tạm ngẫu nhiên và thu hồi token cũ sau khi đổi/reset mật khẩu", async (t) => {
  assert.throws(
    () => assertJwtConfigured({ JWT_SECRET: "   " }),
    /Thiếu cấu hình bắt buộc JWT_SECRET/,
  );
  assert.equal(assertJwtConfigured({ JWT_SECRET: "unit-test-secret" }), "unit-test-secret");

  let dbTokenVersion = 0;
  let mustChangePw = 0;
  t.mock.method(pool, "query", async (sql) => {
    if (/SELECT \*\s+FROM users\s+WHERE id = \?/i.test(sql)) {
      return [[{
        id: 2,
        username: "ketoan01",
        full_name: "Trần Kế Toán",
        role: "BQT",
        account_status: "ACTIVE",
        token_version: dbTokenVersion,
        must_change_password: mustChangePw,
      }], []];
    }
    if (/UPDATE users[\s\S]*SET password_hash = \?/i.test(sql)) {
      dbTokenVersion += 1;
      mustChangePw = 1;
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  });

  const oldToken = signToken({
    id: 2,
    username: "ketoan01",
    role: "BQT",
    token_version: 0,
  });

  const res = await resetStaffPassword(2);
  assert.equal(res.username, "ketoan01");
  assert.equal(res.temporaryPassword.length, 8);
  assert.notEqual(res.temporaryPassword, "123456");
  assert.equal(res.mustChangePassword, true);
  assert.equal(dbTokenVersion, 1);

  const req = { headers: { authorization: `Bearer ${oldToken}` } };
  let nextCalled = false;
  const mockRes = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  await requireAuth(req, mockRes, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(mockRes.statusCode, 401);
});

test("US-015 & Cư dân: Điều kiện ứng viên, đăng ký, cấp TK và xem hộ dùng trạng thái hiệu lực theo ngày VN", async (t) => {
  // 2026-11-27T18:00:00Z = 2026-11-28 01:00:00 Asia/Ho_Chi_Minh
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });

  const residentRows = [
    {
      id: 201,
      household_id: 21,
      full_name: "Chuyển đi đến hạn",
      birth_date: "1990-01-01",
      cccd: "001090000201",
      relationship_to_head: "Chủ hộ",
      current_status: "Thường trú",
      status_start_date: null,
      status_end_date: null,
      apartment_id: 11,
      room_number: "201",
      area: "60.00",
    },
    {
      id: 202,
      household_id: 22,
      full_name: "Chuyển đi tương lai",
      birth_date: "1991-02-02",
      cccd: "001091000202",
      relationship_to_head: "Chủ hộ",
      current_status: "Thường trú",
      status_start_date: null,
      status_end_date: null,
      apartment_id: 12,
      room_number: "202",
      area: "65.00",
    },
    {
      id: 203,
      household_id: 23,
      full_name: "Cột cũ Chuyển đi nhưng đã Chuyển đến",
      birth_date: "1992-03-03",
      cccd: "001092000203",
      relationship_to_head: "Chủ hộ",
      current_status: "Chuyển đi",
      status_start_date: "2026-10-01",
      status_end_date: null,
      apartment_id: 13,
      room_number: "203",
      area: "70.00",
    },
  ];
  const residencyEvents = [
    { id: 1, resident_id: 201, full_name: "Chuyển đi đến hạn", status: "Chuyển đi", start_date: "2026-11-28", end_date: null },
    { id: 2, resident_id: 202, full_name: "Chuyển đi tương lai", status: "Chuyển đi", start_date: "2026-11-29", end_date: null },
    { id: 3, resident_id: 203, full_name: "Cột cũ Chuyển đi nhưng đã Chuyển đến", status: "Chuyển đến", start_date: "2026-11-20", end_date: null },
  ];

  const userToResident = new Map([
    [51, 201],
    [52, 202],
    [53, 203],
  ]);
  const queryLog = [];

  t.mock.method(pool, "query", async (sql, params = []) => {
    queryLog.push({ sql, params });

    if (/LEFT JOIN users u ON u\.resident_id = r\.id/i.test(sql)) {
      const filtered = /r\.current_status <> 'Chuyển đi'/i.test(sql)
        ? residentRows.filter((r) => r.current_status !== "Chuyển đi")
        : residentRows;
      return [filtered, []];
    }

    if (/FROM residents\s+WHERE id IN/i.test(sql)) {
      const idSet = new Set(params.map(Number));
      return [residentRows.filter((r) => idSet.has(r.id)), []];
    }

    if (/FROM residency_events\s+WHERE resident_id IN/i.test(sql)) {
      const idSet = new Set(params.map(Number));
      return [residencyEvents.filter((ev) => idSet.has(ev.resident_id)), []];
    }

    if (/LOWER\(TRIM\(a\.room_number\)\)/i.test(sql)) {
      const room = String(params[0] || "").trim().toLowerCase();
      const name = String(params[1] || "").trim().toLowerCase();
      const hit = residentRows.find(
        (r) => r.room_number.toLowerCase() === room && r.full_name.toLowerCase() === name,
      );
      return [hit ? [hit] : [], []];
    }

    if (/FROM residents r[\s\S]*WHERE r\.id = \?/i.test(sql)) {
      const hit = residentRows.find((r) => r.id === Number(params[0]));
      return [hit ? [hit] : [], []];
    }

    if (/WHERE resident_id = \?/i.test(sql)) return [[], []];
    if (/WHERE username = \?/i.test(sql)) return [[], []];
    if (/INSERT INTO users/i.test(sql)) return [{ insertId: 99 }, []];

    if (/WHERE u\.id = \?\s+AND u\.role = 'RESIDENT'/i.test(sql)) {
      const residentId = userToResident.get(Number(params[0]));
      const hit = residentRows.find((r) => r.id === residentId);
      return [hit ? [{ ...hit, resident_id: hit.id }] : [], []];
    }

    if (/WHERE r\.household_id = \?/i.test(sql) && /FROM residents r/i.test(sql)) {
      return [residentRows.filter((r) => r.household_id === Number(params[0])), []];
    }

    if (/FROM residency_events e/i.test(sql)) {
      const hhId = Number(params[0]);
      const hhResidentIds = new Set(
        residentRows.filter((r) => r.household_id === hhId).map((r) => r.id),
      );
      return [residencyEvents.filter((ev) => hhResidentIds.has(ev.resident_id)), []];
    }

    return [[], []];
  });

  // 1. Candidates list uses effective status in batch (constant queries, excludes 201, includes 202 and 203)
  queryLog.length = 0;
  const candidates = await getResidentAccountOptions();
  assert.deepEqual(candidates.map((c) => c.id), [202, 203]);
  assert.equal(queryLog.length, 3);

  // 2. registerResidentAccount rejects effective Chuyển đi (201), allows future Chuyển đi (202) and active Chuyển đến (203)
  await assert.rejects(
    registerResidentAccount({
      roomNumber: "201",
      fullName: "Chuyển đi đến hạn",
      username: "cudan201",
      password: "password123",
    }),
    { statusCode: 400 },
  );
  const reg202 = await registerResidentAccount({
    roomNumber: "202",
    fullName: "Chuyển đi tương lai",
    username: "cudan202",
    password: "password123",
  });
  assert.equal(reg202.accountStatus, "PENDING");
  const reg203 = await registerResidentAccount({
    roomNumber: "203",
    fullName: "Cột cũ Chuyển đi nhưng đã Chuyển đến",
    username: "cudan203",
    password: "password123",
  });
  assert.equal(reg203.accountStatus, "PENDING");

  // 3. issueResidentAccount rejects effective Chuyển đi (201), allows 202 and 203
  await assert.rejects(
    issueResidentAccount({
      residentId: 201,
      username: "issue201",
      password: "password123",
    }),
    { statusCode: 400 },
  );
  const issued202 = await issueResidentAccount({
    residentId: 202,
    username: "issue202",
    password: "password123",
  });
  assert.equal(issued202.role, "RESIDENT");
  const issued203 = await issueResidentAccount({
    residentId: 203,
    username: "issue203",
    password: "password123",
  });
  assert.equal(issued203.role, "RESIDENT");

  // 4. getMyResidence: 201 rejected 403; 202 & 203 succeed; wrong role 403; unlinked 404
  await assert.rejects(
    getMyResidence({ id: 51, role: "RESIDENT" }),
    { statusCode: 403 },
  );
  const res202 = await getMyResidence({ id: 52, role: "RESIDENT" });
  assert.equal(res202.roomNumber, "202");
  assert.equal(res202.currentStatus, "Thường trú");

  const res203 = await getMyResidence({ id: 53, role: "RESIDENT" });
  assert.equal(res203.roomNumber, "203");
  assert.equal(res203.currentStatus, "Chuyển đến");

  await assert.rejects(getMyResidence({ id: 52, role: "BQT" }), { statusCode: 403 });
  await assert.rejects(getMyResidence({ id: 999, role: "RESIDENT" }), { statusCode: 404 });

  // 5. Batch helper contract: [] returns empty Map with 0 queries; deduplicates IDs; omits non-existent ID
  queryLog.length = 0;
  const emptyMap = await getEffectiveResidencyStatuses([], "2026-11-28");
  assert.equal(emptyMap.size, 0);
  assert.equal(queryLog.length, 0);

  const batchMap = await getEffectiveResidencyStatuses([201, 201, 202, 203, 9999, -1, "abc"], "2026-11-28");
  assert.equal(queryLog.length, 2);
  assert.deepEqual(queryLog[0].params, [201, 202, 203, 9999]);
  assert.equal(batchMap.get(201), "Chuyển đi");
  assert.equal(batchMap.get(202), "Thường trú");
  assert.equal(batchMap.get(203), "Chuyển đến");
  assert.equal(batchMap.has(9999), false);
});

test("US-015 & US-016: approveResidentAccount và login kiểm tra trạng thái cư trú hiệu lực của RESIDENT", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-27T18:00:00Z") });
  const pwHash = await bcrypt.hash("matkhau123", 4);

  const residents = new Map([
    [301, { id: 301, current_status: "Thường trú", status_start_date: null, status_end_date: null }],
    [302, { id: 302, current_status: "Thường trú", status_start_date: null, status_end_date: null }],
    [303, { id: 303, current_status: "Chuyển đi", status_start_date: "2026-10-01", status_end_date: null }],
  ]);
  const events = [
    { id: 1, resident_id: 301, status: "Chuyển đi", start_date: "2026-11-28", end_date: null },
    { id: 2, resident_id: 302, status: "Chuyển đi", start_date: "2026-11-29", end_date: null },
    { id: 3, resident_id: 303, status: "Chuyển đến", start_date: "2026-11-20", end_date: null },
  ];
  const users = new Map([
    [1, { id: 1, username: "admin01", full_name: "Admin", role: "ADMIN", password_hash: pwHash, account_status: "ACTIVE", failed_login_attempts: 0 }],
    [2, { id: 2, username: "bqt01", full_name: "BQT", role: "BQT", password_hash: pwHash, account_status: "ACTIVE", failed_login_attempts: 0 }],
    [61, { id: 61, username: "res_moved", full_name: "Đã chuyển đi", role: "RESIDENT", resident_id: 301, password_hash: pwHash, account_status: "PENDING", failed_login_attempts: 0 }],
    [62, { id: 62, username: "res_future", full_name: "Chuyển đi tương lai", role: "RESIDENT", resident_id: 302, password_hash: pwHash, account_status: "PENDING", failed_login_attempts: 0 }],
    [63, { id: 63, username: "res_returned", full_name: "Đã chuyển đến", role: "RESIDENT", resident_id: 303, password_hash: pwHash, account_status: "PENDING", failed_login_attempts: 0 }],
    [64, { id: 64, username: "res_unlinked", full_name: "Thiếu liên kết", role: "RESIDENT", resident_id: null, password_hash: pwHash, account_status: "PENDING", failed_login_attempts: 0 }],
    [65, { id: 65, username: "res_missing_id", full_name: "ID không tồn tại", role: "RESIDENT", resident_id: 9999, password_hash: pwHash, account_status: "PENDING", failed_login_attempts: 0 }],
  ]);

  let updateStatusCalls = 0;
  let residencyQueries = 0;

  t.mock.method(pool, "query", async (sql, params = []) => {
    if (/SELECT \*\s+FROM users\s+WHERE id = \?/i.test(sql)) {
      const hit = users.get(Number(params[0]));
      return [hit ? [hit] : [], []];
    }
    if (/WHERE username = \?/i.test(sql)) {
      const hit = [...users.values()].find((u) => u.username === params[0]);
      return [hit ? [hit] : [], []];
    }
    if (/SET account_status = \?/i.test(sql)) {
      updateStatusCalls += 1;
      const hit = users.get(Number(params[1]));
      if (hit) hit.account_status = params[0];
      return [{ affectedRows: 1 }, []];
    }
    if (/SET failed_login_attempts = \?/i.test(sql)) {
      const hit = users.get(Number(params[2]));
      if (hit) {
        hit.failed_login_attempts = params[0];
        hit.locked_until = params[1];
      }
      return [{ affectedRows: 1 }, []];
    }
    if (/FROM residents\s+WHERE id IN/i.test(sql)) {
      residencyQueries += 1;
      const rows = params.map((id) => residents.get(Number(id))).filter(Boolean);
      return [rows, []];
    }
    if (/FROM residency_events\s+WHERE resident_id IN/i.test(sql)) {
      const idSet = new Set(params.map(Number));
      return [events.filter((e) => idSet.has(e.resident_id)), []];
    }
    return [[], []];
  });

  // 1. approveResidentAccount: moved-out -> 400 and stays PENDING; unlinked / missing resident -> 404
  await assert.rejects(approveResidentAccount(61), { statusCode: 400 });
  assert.equal(users.get(61).account_status, "PENDING");
  assert.equal(updateStatusCalls, 0);

  await assert.rejects(approveResidentAccount(64), { statusCode: 404 });
  await assert.rejects(approveResidentAccount(65), { statusCode: 404 });
  assert.equal(updateStatusCalls, 0);

  // Future Chuyển đi (62) and active Chuyển đến (63) can be approved
  const app62 = await approveResidentAccount(62);
  assert.equal(app62.accountStatus, "ACTIVE");
  const app63 = await approveResidentAccount(63);
  assert.equal(app63.accountStatus, "ACTIVE");
  assert.equal(updateStatusCalls, 2);

  // 2. login: wrong password on moved-out resident still returns 401 & increments failed_login_attempts without querying residency
  users.get(61).account_status = "ACTIVE";
  users.get(64).account_status = "ACTIVE";
  users.get(65).account_status = "ACTIVE";
  residencyQueries = 0;

  await assert.rejects(login("res_moved", "sai_mat_khau"), { statusCode: 401 });
  assert.equal(users.get(61).failed_login_attempts, 1);
  assert.equal(residencyQueries, 0);

  // Correct password on moved-out or unlinked/missing resident -> 403 and no token
  await assert.rejects(login("res_moved", "matkhau123"), { statusCode: 403 });
  await assert.rejects(login("res_unlinked", "matkhau123"), { statusCode: 403 });
  await assert.rejects(login("res_missing_id", "matkhau123"), { statusCode: 403 });

  // Future Chuyển đi (62) and active Chuyển đến (63) login normally
  const login62 = await login("res_future", "matkhau123");
  assert.ok(login62.token);
  const login63 = await login("res_returned", "matkhau123");
  assert.ok(login63.token);

  // ADMIN and BQT login without querying residency status
  residencyQueries = 0;
  const adminLogin = await login("admin01", "matkhau123");
  const bqtLogin = await login("bqt01", "matkhau123");
  assert.ok(adminLogin.token);
  assert.ok(bqtLogin.token);
  assert.equal(residencyQueries, 0);
});
