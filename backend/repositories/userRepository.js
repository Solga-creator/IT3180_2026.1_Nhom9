import { pool } from "../config/database.js";

export function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone || "",
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
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
  accountStatus = "ACTIVE",
}) {
  const [result] = await pool.query(
    `INSERT INTO users (
      username,
      full_name,
      password_hash,
      role,
      resident_id,
      account_status
    )
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      username,
      fullName,
      passwordHash,
      role,
      residentId,
      accountStatus,
    ],
  );
  return result.insertId;
}

export async function updateAccountStatus(id, accountStatus) {
  await pool.query(
    `UPDATE users
     SET account_status = ?
     WHERE id = ?`,
    [accountStatus, id],
  );
}

export async function recordFailedLogin(id, attempts, lockedUntil) {
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = ?,
         locked_until = ?
     WHERE id = ?`,
    [attempts, lockedUntil, id],
  );
}

export async function clearFailedLogin(id) {
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = 0,
         locked_until = NULL
     WHERE id = ?`,
    [id],
  );
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

export async function updatePassword(
  id,
  passwordHash,
  { mustChangePassword = false } = {},
) {
  await pool.query(
    `UPDATE users
     SET password_hash = ?,
         token_version = COALESCE(token_version, 0) + 1,
         must_change_password = ?
     WHERE id = ?`,
    [
      passwordHash,
      mustChangePassword ? 1 : 0,
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
      r.current_status,
      a.room_number
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     LEFT JOIN users u ON u.resident_id = r.id
     WHERE u.id IS NULL
       AND r.current_status <> 'Chuyển đi'
     ORDER BY a.room_number ASC, r.id ASC`,
  );
  return rows;
}

export async function listResidentAccounts() {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.username,
      u.account_status,
      r.full_name,
      r.current_status,
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
      r.current_status,
      a.room_number
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE r.id = ?`,
    [residentId],
  );
  return rows[0] || null;
}

export async function findResidentByRoomAndName(roomNumber, fullName) {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.full_name,
      r.relationship_to_head,
      r.current_status,
      a.room_number
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE LOWER(TRIM(a.room_number)) = LOWER(TRIM(?))
       AND LOWER(TRIM(r.full_name)) = LOWER(TRIM(?))
     LIMIT 1`,
    [roomNumber, fullName],
  );
  return rows[0] || null;
}

export async function findResidenceForUser(userId) {
  const [rows] = await pool.query(
    `SELECT
      r.id AS resident_id,
      r.household_id,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.cccd,
      r.relationship_to_head,
      r.current_status,
      a.id AS apartment_id,
      a.room_number,
      a.area
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

export async function listHouseholdMembersByHouseholdId(householdId) {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.cccd,
      r.relationship_to_head,
      r.current_status,
      DATE_FORMAT(r.status_start_date, '%Y-%m-%d') AS status_start_date,
      DATE_FORMAT(r.status_end_date, '%Y-%m-%d') AS status_end_date
     FROM residents r
     WHERE r.household_id = ?
     ORDER BY (r.relationship_to_head = 'Chủ hộ') DESC, r.id ASC`,
    [householdId],
  );
  return rows;
}

export async function listHouseholdEventsByHouseholdId(householdId) {
  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.resident_id,
      r.full_name,
      e.status,
      DATE_FORMAT(e.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(e.end_date, '%Y-%m-%d') AS end_date,
      e.created_at
     FROM residency_events e
     JOIN residents r ON r.id = e.resident_id
     WHERE r.household_id = ?
     ORDER BY e.start_date DESC, e.id DESC`,
    [householdId],
  );
  return rows;
}

export async function countAdmins() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM users
     WHERE role = 'ADMIN'`,
  );
  return rows[0].n;
}
