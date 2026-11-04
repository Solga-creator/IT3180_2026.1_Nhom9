import { pool } from "../config/database.js";

export function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone || "",
    role: row.role,
  };
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT *
     FROM users
     WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findUserByUsername(username) {
  const [rows] = await pool.query(
    `SELECT *
     FROM users
     WHERE username = ?`,
    [username],
  );
  return rows[0] || null;
}

export async function createUser({
  username,
  fullName,
  passwordHash,
  role = "BQT",
}) {
  const [result] = await pool.query(
    `INSERT INTO users (
      username,
      full_name,
      password_hash,
      role
    )
    VALUES (?, ?, ?, ?)`,
    [
      username,
      fullName,
      passwordHash,
      role,
    ],
  );
  return result.insertId;
}

export async function listUsers() {
  const [rows] = await pool.query(
    `SELECT
      id,
      username,
      full_name,
      role,
      created_at
     FROM users
     ORDER BY id ASC`,
  );
  return rows;
}

export async function updateProfile(
  id,
  {
    fullName,
    phone,
  },
) {
  await pool.query(
    `UPDATE users
     SET full_name = ?,
         phone = ?
     WHERE id = ?`,
    [
      fullName,
      phone || null,
      id,
    ],
  );
  return findUserById(id);
}

export async function updatePassword(id, passwordHash) {
  await pool.query(
    `UPDATE users
     SET password_hash = ?
     WHERE id = ?`,
    [
      passwordHash,
      id,
    ],
  );
}

export async function findPasswordHash(id) {
  const [rows] = await pool.query(
    `SELECT password_hash
     FROM users
     WHERE id = ?`,
    [id],
  );
  return rows[0]?.password_hash || null;
}

export async function deleteUser(id) {
  await pool.query(
    `DELETE FROM users
     WHERE id = ?`,
    [id],
  );
}

export async function countAdmins() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM users
     WHERE role = 'ADMIN'`,
  );
  return rows[0].n;
}
