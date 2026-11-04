import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { migrate, pool, publicUser } from "./db.js";
import { requireAuth, requireAdmin, signToken } from "./auth.js";
import { debug } from "./debug.js";

const app = express();
app.use(cors({ origin: ["http://localhost:5174", "http://127.0.0.1:5174"], credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Nhập tên đăng nhập và mật khẩu." });
  }
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    debug("login failed", username);
    return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." });
  }
  const token = signToken(user);
  debug("login ok", username);
  return res.json({ success: true, token, user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post("/api/accounts", requireAuth, requireAdmin, async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const fullName = String(req.body?.fullName || "").trim();
  const password = String(req.body?.password || "");
  if (username.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return res.status(400).json({ success: false, message: "Tên đăng nhập từ 3 ký tự, không dấu cách." });
  }
  if (fullName.length < 2) {
    return res.status(400).json({ success: false, message: "Nhập họ tên thành viên BQT." });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Mật khẩu khởi tạo tối thiểu 6 ký tự." });
  }
  const [dup] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
  if (dup.length) {
    return res.status(409).json({ success: false, message: "Tên đăng nhập đã được cấp." });
  }
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (username, full_name, password_hash, role) VALUES (?, ?, ?, 'BQT')",
    [username, fullName, hash],
  );
  debug("issued account", username);
  res.status(201).json({
    success: true,
    user: { id: result.insertId, username, fullName, role: "BQT" },
  });
});

app.get("/api/accounts", requireAuth, requireAdmin, async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, username, full_name, role, created_at FROM users ORDER BY id ASC",
  );
  res.json({
    success: true,
    users: rows.map((r) => ({
      id: r.id,
      username: r.username,
      fullName: r.full_name,
      role: r.role,
      createdAt: r.created_at,
    })),
  });
});

app.delete("/api/accounts/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Tài khoản không hợp lệ." });
  }
  const [rows] = await pool.query("SELECT id, username, role FROM users WHERE id = ?", [id]);
  const target = rows[0];
  if (!target) {
    return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
  }
  if (target.id === req.user.id) {
    return res.status(400).json({ success: false, message: "Không thể xóa tài khoản đang đăng nhập." });
  }
  if (target.role === "ADMIN") {
    const [admins] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'ADMIN'");
    if (admins[0].n <= 1) {
      return res.status(400).json({ success: false, message: "Không thể xóa quản trị viên cuối cùng." });
    }
  }
  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  debug("deleted account", target.username);
  res.json({ success: true, username: target.username });
});

function stubBusiness(_req, res) {
  res.json({ success: true, items: [] });
}

app.get("/api/apartments", requireAuth, stubBusiness);
app.get("/api/residents", requireAuth, stubBusiness);
app.get("/api/fees", requireAuth, stubBusiness);
app.get("/api/reports", requireAuth, stubBusiness);

app.use((err, _req, res, _next) => {
  debug("unhandled", err.message);
  res.status(500).json({ success: false, message: "Lỗi máy chủ." });
});

const port = Number(process.env.PORT || 3001);
await migrate();
const server = app.listen(port, "127.0.0.1", () => {
  console.info(`BlueMoon SE09 API http://127.0.0.1:${port}`);
});
server.on("error", (err) => {
  console.error("listen failed", err.message);
  process.exit(1);
});
