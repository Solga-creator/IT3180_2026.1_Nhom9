import "dotenv/config";
import bcrypt from "bcrypt";
import { migrate, pool } from "./db.js";
import { debug } from "./debug.js";

await migrate();

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "admin123";
const fullName = process.env.ADMIN_FULL_NAME || "Quản trị viên SE09";
const hash = await bcrypt.hash(password, 10);

const [existing] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
if (existing.length) {
  debug("admin already exists", username);
} else {
  await pool.query(
    "INSERT INTO users (username, full_name, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
    [username, fullName, hash],
  );
  debug("seeded admin", username);
}

await pool.end();
console.info("Seed xong. Đăng nhập quản trị:", username);
