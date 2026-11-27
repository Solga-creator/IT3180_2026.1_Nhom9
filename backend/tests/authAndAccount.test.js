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
  registerResidentAccount,
} from "../services/residentAccountService.js";
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
  t.mock.method(pool, "query", async (sql) => {
    if (/LOWER\(TRIM\(a\.room_number\)\)/i.test(sql)) {
      return [[{
        id: 100,
        full_name: "Nguyễn Văn An",
        relationship_to_head: "Chủ hộ",
        current_status: residencyStatus,
        room_number: "050",
      }], []];
    }
    if (/WHERE resident_id = \?/i.test(sql)) return [[], []];
    if (/WHERE username = \?/i.test(sql)) return [[], []];
    if (/INSERT INTO users/i.test(sql)) return [{ insertId: 15 }, []];
    if (/SELECT \*\s+FROM users\s+WHERE id = \?/i.test(sql)) {
      return [[{ id: 15, username: "cudan050", role: "RESIDENT", account_status: currentStatus }], []];
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
