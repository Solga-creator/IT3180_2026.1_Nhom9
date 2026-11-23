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
  residentId = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO users (
      username,
      full_name,
      password_hash,
      role,
      resident_id
    )
    VALUES (?, ?, ?, ?, ?)`,
    [
      username,
      fullName,
      passwordHash,
      role,
      residentId,
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
     WHERE role IN ('ADMIN', 'BQT')
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

export async function findUserByResidentId(residentId) {
  const [rows] = await pool.query(
    `SELECT id, username, role
     FROM users
     WHERE resident_id = ?`,
    [residentId],
  );
  return rows[0] || null;
}

export async function listResidentsWithoutAccount() {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.full_name,
      r.relationship_to_head,
      a.room_number
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     LEFT JOIN users u ON u.resident_id = r.id
     WHERE u.id IS NULL
     ORDER BY a.room_number ASC, r.id ASC`,
  );
  return rows;
}

export async function listResidentAccounts() {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.username,
      r.full_name,
      a.room_number,
      u.created_at
     FROM users u
     JOIN residents r ON r.id = u.resident_id
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE u.role = 'RESIDENT'
     ORDER BY a.room_number ASC, u.id ASC`,
  );
  return rows;
}

export async function findResidentIdentity(residentId) {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.full_name,
      r.relationship_to_head,
      a.room_number
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE r.id = ?`,
    [residentId],
  );
  return rows[0] || null;
}

export async function findResidenceForUser(userId) {
  const [rows] = await pool.query(
    `SELECT
      r.full_name,
      r.relationship_to_head,
      a.room_number
     FROM users u
     JOIN residents r ON r.id = u.resident_id
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE u.id = ?
       AND u.role = 'RESIDENT'`,
    [userId],
  );
  return rows[0] || null;
}

export async function countAdmins() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM users
     WHERE role = 'ADMIN'`,
  );
  return rows[0].n;
}
