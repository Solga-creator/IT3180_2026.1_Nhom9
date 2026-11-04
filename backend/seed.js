import "dotenv/config";
import bcrypt from "bcrypt";
import { migrate, pool } from "./config/database.js";
import { createUser, findUserByUsername } from "./repositories/userRepository.js";
import { debug } from "./helpers/debug.js";

await migrate();

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "admin123";
const fullName = process.env.ADMIN_FULL_NAME || "Quản trị viên SE09";
const hash = await bcrypt.hash(password, 10);

const existing = await findUserByUsername(username);
if (existing) {
  debug("admin already exists", username);
} else {
  await createUser({
    username,
    fullName,
    passwordHash: hash,
    role: "ADMIN",
  });
  debug("seeded admin", username);
}

await pool.end();
console.info("Seed xong. Đăng nhập quản trị:", username);
