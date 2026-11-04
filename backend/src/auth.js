import jwt from "jsonwebtoken";
import { pool, publicUser } from "./db.js";

const SECRET = process.env.JWT_SECRET || "se09-dev-only-not-for-production";

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, username: user.username }, SECRET, {
    expiresIn: "12h",
  });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập." });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [payload.sub]);
    if (!rows.length) {
      return res.status(401).json({ success: false, message: "Tài khoản không còn hiệu lực." });
    }
    req.user = publicUser(rows[0]);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Phiên đăng nhập không hợp lệ." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Chỉ quản trị viên được thao tác tài khoản." });
  }
  next();
}
