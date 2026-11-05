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

