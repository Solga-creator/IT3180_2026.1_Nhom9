import mysql from "mysql2/promise";
import { debug } from "./debug.js";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bluemoon_se09",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('ADMIN', 'BQT') NOT NULL DEFAULT 'BQT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  debug("migrated users table");
}

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
  };
}
