import { pool } from "../config/database.js";

function mapEvent(row) {
  return {
    id: row.id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

function mapResident(row, events) {
  return {
    id: row.id,
    householdId: row.household_id,
    apartmentId: row.apartment_id,
    roomNumber: row.room_number,
    fullName: row.full_name,
    birthDate: row.birth_date,
    relationship: row.relationship_to_head,
    currentStatus: row.current_status,
    statusStartDate: row.status_start_date,
    statusEndDate: row.status_end_date,
    createdAt: row.created_at,
    residencyHistory: events.map(mapEvent),
  };
}

async function getResidentById(id, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      r.id,
      r.household_id,
      h.apartment_id,
      a.room_number,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.relationship_to_head,
      r.current_status,
      DATE_FORMAT(r.status_start_date, '%Y-%m-%d') AS status_start_date,
      DATE_FORMAT(r.status_end_date, '%Y-%m-%d') AS status_end_date,
      r.created_at
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE r.id = ?`,
    [id],
  );

  if (!rows[0]) return null;

  const events = await getResidencyEvents(id, executor);
  return mapResident(rows[0], events);
}

async function getResidencyEvents(residentId, executor = pool) {
  const [rows] = await executor.query(
    `SELECT
      id,
      status,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
      created_at
     FROM residency_events
     WHERE resident_id = ?
     ORDER BY start_date DESC, id DESC`,
    [residentId],
  );
  return rows;
}

export async function listResidents(searchInput = "") {
  const search = String(searchInput || "").trim();
  const values = search ? [`%${search}%`, `%${search}%`] : [];
  const searchClause = search
    ? "WHERE a.room_number LIKE ? OR r.full_name LIKE ?"
    : "";
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.household_id,
      h.apartment_id,
      a.room_number,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.relationship_to_head,
      r.current_status,
      DATE_FORMAT(r.status_start_date, '%Y-%m-%d') AS status_start_date,
      DATE_FORMAT(r.status_end_date, '%Y-%m-%d') AS status_end_date,
      r.created_at
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     ${searchClause}
     ORDER BY a.room_number ASC, r.id ASC`,
    values,
  );

  if (rows.length === 0) return [];

  const residentIds = rows.map((row) => row.id);
  const placeholders = residentIds.map(() => "?").join(", ");
  const [eventRows] = await pool.query(
    `SELECT
      id,
      resident_id,
      status,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
      created_at
     FROM residency_events
     WHERE resident_id IN (${placeholders})
     ORDER BY start_date DESC, id DESC`,
    residentIds,
  );

  const eventsByResident = new Map();
  for (const event of eventRows) {
    const events = eventsByResident.get(event.resident_id) || [];
    events.push(event);
    eventsByResident.set(event.resident_id, events);
  }

  return rows.map((row) =>
    mapResident(row, eventsByResident.get(row.id) || []),
  );
}

export async function listResidentsByStatus(status) {
  const [rows] = await pool.query(
    `SELECT
      a.room_number,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.relationship_to_head,
      r.current_status
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     WHERE r.current_status = ?
     ORDER BY a.room_number ASC, r.id ASC`,
    [status],
  );
  return rows;
}

export async function createResident(input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [apartments] = await connection.query(
      `SELECT id
       FROM apartments
       WHERE id = ?
       FOR UPDATE`,
      [input.apartmentId],
    );
    if (!apartments[0]) {
      await connection.rollback();
      return { reason: "APARTMENT_NOT_FOUND" };
    }

    const [households] = await connection.query(
      `SELECT id, head_resident_id
       FROM households
       WHERE apartment_id = ?
       FOR UPDATE`,
      [input.apartmentId],
    );

    let householdId = households[0]?.id;
    if (!householdId) {
      if (input.relationship !== "Chủ hộ") {
        await connection.rollback();
        return { reason: "HOUSEHOLD_HEAD_REQUIRED" };
      }

      const [result] = await connection.query(
        `INSERT INTO households (apartment_id)
         VALUES (?)`,
        [input.apartmentId],
      );
      householdId = result.insertId;
    } else if (input.relationship === "Chủ hộ") {
      await connection.rollback();
      return { reason: "HOUSEHOLD_HEAD_EXISTS" };
    }

    const [result] = await connection.query(
      `INSERT INTO residents (
        household_id,
        full_name,
        birth_date,
        relationship_to_head
      )
      VALUES (?, ?, ?, ?)`,
      [
        householdId,
        input.fullName,
        input.birthDate,
        input.relationship,
      ],
    );

    if (input.relationship === "Chủ hộ") {
      await connection.query(
        `UPDATE households
         SET head_resident_id = ?
         WHERE id = ?`,
        [result.insertId, householdId],
      );
    }

    const resident = await getResidentById(result.insertId, connection);
    await connection.commit();
    return { resident };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return { reason: "HOUSEHOLD_HEAD_EXISTS" };
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function createResidencyEvent(residentId, event, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [residents] = await connection.query(
      `SELECT id, household_id
       FROM residents
       WHERE id = ?
       FOR UPDATE`,
      [residentId],
    );
    if (!residents[0]) {
      await connection.rollback();
      return null;
    }

    await connection.query(
      `INSERT INTO residency_events (
        resident_id,
        status,
        start_date,
        end_date,
        recorded_by
      )
      VALUES (?, ?, ?, ?, ?)`,
      [residentId, event.status, event.startDate, event.endDate, userId],
    );
    await connection.query(
      `UPDATE residents
       SET current_status = ?,
           status_start_date = ?,
           status_end_date = ?
       WHERE id = ?`,
      [event.status, event.startDate, event.endDate, residentId],
    );

    const resident = await getResidentById(residentId, connection);
    await connection.commit();
    return resident;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
