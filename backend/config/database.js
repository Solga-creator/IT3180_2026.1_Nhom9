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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS households (
      id INT AUTO_INCREMENT PRIMARY KEY,
      apartment_id INT NOT NULL UNIQUE,
      head_resident_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_households_apartment
        FOREIGN KEY (apartment_id) REFERENCES apartments(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS residents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      household_id INT NOT NULL,
      full_name VARCHAR(120) NOT NULL,
      birth_date DATE NOT NULL,
      relationship_to_head VARCHAR(30) NOT NULL,
      current_status VARCHAR(30) NOT NULL DEFAULT 'Thường trú',
      status_start_date DATE NULL,
      status_end_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_residents_name (full_name),
      CONSTRAINT fk_residents_household
        FOREIGN KEY (household_id) REFERENCES households(id)
        ON DELETE CASCADE
    )
  `);

  const [headReference] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM information_schema.key_column_usage
     WHERE table_schema = DATABASE()
       AND table_name = 'households'
       AND constraint_name = 'fk_households_head'`,
  );
  if (headReference[0].n === 0) {
    await pool.query(`
      ALTER TABLE households
      ADD CONSTRAINT fk_households_head
      FOREIGN KEY (head_resident_id) REFERENCES residents(id)
      ON DELETE SET NULL
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS residency_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resident_id INT NOT NULL,
      status VARCHAR(30) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      recorded_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_residency_events_resident (resident_id, start_date, id),
      CONSTRAINT fk_residency_events_resident
        FOREIGN KEY (resident_id) REFERENCES residents(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_residency_events_user
        FOREIGN KEY (recorded_by) REFERENCES users(id)
        ON DELETE SET NULL
    )
  `);
  debug("migrated household and residency tables");
}
