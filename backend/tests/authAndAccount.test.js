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
} from "../services/accountService.js";
import {
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
    if (/FROM users\s+ORDER BY id ASC/i.test(sql)) {
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
