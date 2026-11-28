import { pool } from "../config/database.js";

export function toApartment(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomNumber: row.room_number,
    area: Number(row.area),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findApartmentById(id) {
  const [rows] = await pool.query(
    `SELECT id, room_number, area, created_at, updated_at
     FROM apartments
     WHERE id = ?`,
    [id],
  );
  return toApartment(rows[0]);
}

export async function findApartmentByRoomNumber(roomNumber) {
  const [rows] = await pool.query(
    `SELECT id, room_number, area, created_at, updated_at
     FROM apartments
     WHERE room_number = ?`,
    [roomNumber],
  );
  return toApartment(rows[0]);
}

export async function createApartment({ roomNumber, area }) {
  const [result] = await pool.query(
    `INSERT INTO apartments (
      room_number,
      area
    )
    VALUES (?, ?)`,
    [roomNumber, area],
  );
  return result.insertId;
}

export async function listApartments() {
  const [rows] = await pool.query(
    `SELECT id, room_number, area, created_at, updated_at
     FROM apartments
     ORDER BY room_number ASC, id ASC`,
  );
  return rows.map(toApartment);
}

export async function updateApartmentById(id, { roomNumber, area }) {
  await pool.query(
    `UPDATE apartments
     SET room_number = ?,
         area = ?
     WHERE id = ?`,
    [roomNumber, area, id],
  );
  return findApartmentById(id);
}

export async function countResidentsByApartmentId(apartmentId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM residents r
     JOIN households h ON h.id = r.household_id
     WHERE h.apartment_id = ?`,
    [apartmentId],
  );
  return Number(rows[0]?.n || 0);
}

export async function deleteApartmentById(id) {
  await pool.query(
    `DELETE FROM apartments
     WHERE id = ?`,
    [id],
  );
}

export async function deleteEmptyApartmentById(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, room_number, area, created_at, updated_at
       FROM apartments
       WHERE id = ?
       FOR UPDATE`,
      [id],
    );
    if (!rows[0]) {
      await connection.rollback();
      return { reason: "NOT_FOUND" };
    }

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS n
       FROM residents r
       JOIN households h ON h.id = r.household_id
       WHERE h.apartment_id = ?`,
      [id],
    );
    const residentCount = Number(countRows[0]?.n || 0);
    if (residentCount > 0) {
      await connection.rollback();
      return { reason: "HAS_RESIDENTS" };
    }

    await connection.query(
      `DELETE FROM apartments
       WHERE id = ?`,
      [id],
    );

    await connection.commit();
    return { apartment: toApartment(rows[0]) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


