import mysql from "mysql2/promise";
import { debug } from "../helpers/debug.js";

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
      phone VARCHAR(30) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('ADMIN', 'BQT') NOT NULL DEFAULT 'BQT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [phoneColumn] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name = 'phone'`,
  );
  if (phoneColumn[0].n === 0) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER full_name",
    );
  }
  debug("migrated users table");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS apartments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_number VARCHAR(50) NOT NULL UNIQUE,
      area DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  debug("migrated apartments table");
}
