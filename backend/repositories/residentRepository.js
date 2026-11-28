import { pool } from "../config/database.js";
import { getBusinessDate } from "../../shared/businessDate.mjs";

function mapEvent(row) {
  return {
    id: row.id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

export function resolveEffectiveResidencyStatus(
  row,
  events = [],
  referenceDate = getBusinessDate(),
) {
  const fallback = {
    currentStatus: row?.current_status || "Thường trú",
    statusStartDate: row?.status_start_date || null,
    statusEndDate: row?.status_end_date || null,
  };

  if (Array.isArray(events) && events.length > 0) {
    const activeEvent = events.find((ev) => {
      const start = String(ev.start_date || ev.startDate || "");
      const end = ev.end_date ?? ev.endDate ?? null;
      return start && start <= referenceDate && (!end || String(end) >= referenceDate);
    });
    if (activeEvent) {
      return {
        currentStatus: activeEvent.status,
        statusStartDate: activeEvent.start_date || activeEvent.startDate || null,
        statusEndDate: activeEvent.end_date ?? activeEvent.endDate ?? null,
      };
    }

    const pastEvents = events.filter((ev) => {
      const start = String(ev.start_date || ev.startDate || "");
      return start && start <= referenceDate;
    });
    if (pastEvents.length > 0) {
      const baseEvent = pastEvents.find((ev) =>
        ["Thường trú", "Chuyển đến", "Chuyển đi"].includes(ev.status),
      );
      if (baseEvent) {
        return {
          currentStatus: baseEvent.status,
          statusStartDate: baseEvent.start_date || baseEvent.startDate || null,
          statusEndDate: baseEvent.end_date ?? baseEvent.endDate ?? null,
        };
      }
      return {
        currentStatus: "Thường trú",
        statusStartDate: null,
        statusEndDate: null,
      };
    }
    return fallback;
  }

  if (
    fallback.statusEndDate &&
    String(fallback.statusEndDate) < referenceDate &&
    (fallback.currentStatus === "Tạm vắng" || fallback.currentStatus === "Tạm trú")
  ) {
    return {
      currentStatus: "Thường trú",
      statusStartDate: null,
      statusEndDate: null,
    };
  }

  return fallback;
}

function mapResident(
  row,
  events,
  { includeHistory = true, referenceDate = getBusinessDate() } = {},
) {
  const effective = resolveEffectiveResidencyStatus(row, events, referenceDate);
  return {
    id: row.id,
    householdId: row.household_id,
    apartmentId: row.apartment_id,
    roomNumber: row.room_number,
    fullName: row.full_name,
    birthDate: row.birth_date,
    cccd: row.cccd || "",
    relationship: row.relationship_to_head,
    householdHeadId: row.head_resident_id || null,
    householdHeadName:
      row.head_full_name ||
      (row.relationship_to_head === "Chủ hộ" ? row.full_name : null),
    currentStatus: effective.currentStatus,
    statusStartDate: effective.statusStartDate,
    statusEndDate: effective.statusEndDate,
    createdAt: row.created_at,
    historyCount: events.length,
    residencyHistory: includeHistory ? events.map(mapEvent) : [],
  };
}

async function getResidentById(
  id,
  executor = pool,
  referenceDate = getBusinessDate(),
) {
  const [rows] = await executor.query(
    `SELECT
      r.id,
      r.household_id,
      h.apartment_id,
      h.head_resident_id,
      head_r.full_name AS head_full_name,
      a.room_number,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.cccd,
      r.relationship_to_head,
      r.current_status,
      DATE_FORMAT(r.status_start_date, '%Y-%m-%d') AS status_start_date,
      DATE_FORMAT(r.status_end_date, '%Y-%m-%d') AS status_end_date,
      r.created_at
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     LEFT JOIN residents head_r ON head_r.id = h.head_resident_id
     WHERE r.id = ?`,
    [id],
  );

  if (!rows[0]) return null;

  const events = await getResidencyEvents(id, executor);
  return mapResident(rows[0], events, { referenceDate });
}

export async function getResidentHistoryById(residentId) {
  const events = await getResidencyEvents(residentId);
  return events.map(mapEvent);
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

export function isResidencyEventEffective(
  event,
  currentStartDate = null,
  referenceDate = getBusinessDate(),
) {
  const startDate = String(event?.startDate || "");
  const endDate = event?.endDate ? String(event.endDate) : null;
  if (!startDate || startDate > referenceDate) {
    return false;
  }
  if (endDate && endDate < referenceDate) {
    return false;
  }
  if (currentStartDate && startDate < String(currentStartDate)) {
    return false;
  }
  return true;
}

export async function listResidents(searchInput = "", options = {}) {
  const search = String(searchInput || "").trim();
  const status = String(options?.status || "").trim();
  const apartmentId = Number(options?.apartmentId) || 0;
  const includeHistory = options?.includeHistory !== false;
  const referenceDate = options?.referenceDate || getBusinessDate();

  const conditions = [];
  const values = [];
  if (search) {
    conditions.push("(a.room_number LIKE ? OR r.full_name LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }
  if (apartmentId > 0) {
    conditions.push("a.id = ?");
    values.push(apartmentId);
  }
  const searchClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.household_id,
      h.apartment_id,
      h.head_resident_id,
      head_r.full_name AS head_full_name,
      a.room_number,
      r.full_name,
      DATE_FORMAT(r.birth_date, '%Y-%m-%d') AS birth_date,
      r.cccd,
      r.relationship_to_head,
      r.current_status,
      DATE_FORMAT(r.status_start_date, '%Y-%m-%d') AS status_start_date,
      DATE_FORMAT(r.status_end_date, '%Y-%m-%d') AS status_end_date,
      r.created_at
     FROM residents r
     JOIN households h ON h.id = r.household_id
     JOIN apartments a ON a.id = h.apartment_id
     LEFT JOIN residents head_r ON head_r.id = h.head_resident_id
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

  const mapped = rows.map((row) =>
    mapResident(row, eventsByResident.get(row.id) || [], {
      includeHistory,
      referenceDate,
    }),
  );

  return status
    ? mapped.filter((resident) => resident.currentStatus === status)
    : mapped;
}

export async function getEffectiveResidencyStatuses(
  residentIds,
  referenceDate = getBusinessDate(),
) {
  const normalizedIds = [
    ...new Set(
      (Array.isArray(residentIds) ? residentIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
  const statusMap = new Map();
  if (normalizedIds.length === 0) return statusMap;

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const [residentRows] = await pool.query(
    `SELECT
      id,
      current_status,
      DATE_FORMAT(status_start_date, '%Y-%m-%d') AS status_start_date,
      DATE_FORMAT(status_end_date, '%Y-%m-%d') AS status_end_date
     FROM residents
     WHERE id IN (${placeholders})`,
    normalizedIds,
  );
  if (residentRows.length === 0) return statusMap;

  const foundIds = residentRows.map((row) => row.id);
  const eventPlaceholders = foundIds.map(() => "?").join(", ");
  const [eventRows] = await pool.query(
    `SELECT
      id,
      resident_id,
      status,
      DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
     FROM residency_events
     WHERE resident_id IN (${eventPlaceholders})
     ORDER BY start_date DESC, id DESC`,
    foundIds,
  );

  const eventsByResident = new Map();
  for (const event of eventRows) {
    const list = eventsByResident.get(event.resident_id) || [];
    list.push(event);
    eventsByResident.set(event.resident_id, list);
  }

  for (const row of residentRows) {
    const effective = resolveEffectiveResidencyStatus(
      row,
      eventsByResident.get(row.id) || [],
      referenceDate,
    );
    statusMap.set(row.id, effective.currentStatus);
  }
  return statusMap;
}

export async function listResidentsByStatus(status, searchInput = "", options = {}) {
  const residents = await listResidents(searchInput, {
    status,
    apartmentId: options.apartmentId,
    includeHistory: false,
  });
  return residents.map((resident) => ({
    room_number: resident.roomNumber,
    full_name: resident.fullName,
    birth_date: resident.birthDate,
    relationship_to_head: resident.relationship,
    current_status: resident.currentStatus,
  }));
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
        cccd,
        relationship_to_head
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        householdId,
        input.fullName,
        input.birthDate,
        input.cccd || null,
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
  const referenceDate = getBusinessDate();
  try {
    await connection.beginTransaction();

    const [residents] = await connection.query(
      `SELECT id, household_id, current_status,
              DATE_FORMAT(status_start_date, '%Y-%m-%d') AS status_start_date,
              DATE_FORMAT(status_end_date, '%Y-%m-%d') AS status_end_date
       FROM residents
       WHERE id = ?
       FOR UPDATE`,
      [residentId],
    );
    if (!residents[0]) {
      await connection.rollback();
      return null;
    }

    const beforeEvents = await getResidencyEvents(residentId, connection);
    const beforeEffective = resolveEffectiveResidencyStatus(
      residents[0],
      beforeEvents,
      referenceDate,
    );

    const normalizedEndDate = event.endDate ? event.endDate : null;
    const [insertResult] = await connection.query(
      `INSERT INTO residency_events (
        resident_id,
        status,
        start_date,
        end_date,
        recorded_by
      )
      VALUES (?, ?, ?, ?, ?)`,
      [residentId, event.status, event.startDate, normalizedEndDate, userId],
    );

    const insertedEvent = {
      id: Number(insertResult?.insertId) || Number.MAX_SAFE_INTEGER,
      resident_id: residentId,
      status: event.status,
      start_date: event.startDate,
      end_date: normalizedEndDate,
    };
    const queriedAfter = await getResidencyEvents(residentId, connection);
    const hasInsertedInQuery = queriedAfter.some(
      (ev) =>
        Number(ev.id) === Number(insertResult?.insertId) &&
        ev.status === event.status &&
        String(ev.start_date) === String(event.startDate),
    );
    const afterEvents = hasInsertedInQuery
      ? queriedAfter
      : [...beforeEvents, insertedEvent].sort(
          (a, b) =>
            String(b.start_date || b.startDate || "").localeCompare(
              String(a.start_date || a.startDate || ""),
            ) || Number(b.id || 0) - Number(a.id || 0),
        );
    const afterEffective = resolveEffectiveResidencyStatus(
      residents[0],
      afterEvents,
      referenceDate,
    );

    const effective = isResidencyEventEffective(
      { startDate: event.startDate, endDate: normalizedEndDate },
      residents[0].status_start_date || null,
      referenceDate,
    );
    const statusChanged =
      afterEffective.currentStatus !== beforeEffective.currentStatus ||
      afterEffective.statusStartDate !== beforeEffective.statusStartDate ||
      afterEffective.statusEndDate !== beforeEffective.statusEndDate;

    if (effective || statusChanged) {
      await connection.query(
        `UPDATE residents
         SET current_status = ?,
             status_start_date = ?,
             status_end_date = ?
         WHERE id = ?`,
        [
          afterEffective.currentStatus,
          afterEffective.statusStartDate,
          afterEffective.statusEndDate,
          residentId,
        ],
      );
    }

    if (
      beforeEffective.currentStatus !== "Chuyển đi" &&
      afterEffective.currentStatus === "Chuyển đi"
    ) {
      await connection.query(
        `UPDATE users
         SET token_version = COALESCE(token_version, 0) + 1
         WHERE resident_id = ?
           AND role = 'RESIDENT'`,
        [residentId],
      );
    }

    const resident = await getResidentById(
      residentId,
      connection,
      referenceDate,
    );
    await connection.commit();
    return resident;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateResidentById(residentId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [residents] = await connection.query(
      `SELECT id, household_id, relationship_to_head
       FROM residents
       WHERE id = ?
       FOR UPDATE`,
      [residentId],
    );
    if (!residents[0]) {
      await connection.rollback();
      return { reason: "RESIDENT_NOT_FOUND" };
    }

    const current = residents[0];
    const [households] = await connection.query(
      `SELECT id, head_resident_id
       FROM households
       WHERE id = ?
       FOR UPDATE`,
      [current.household_id],
    );
    const household = households[0];

    if (
      current.relationship_to_head === "Chủ hộ" &&
      input.relationship !== "Chủ hộ" &&
      household?.head_resident_id === residentId
    ) {
      await connection.rollback();
      return { reason: "CANNOT_DEMOTE_HEAD_DIRECTLY" };
    }

    if (input.relationship === "Chủ hộ" && household && household.head_resident_id !== residentId) {
      if (household.head_resident_id) {
        await connection.query(
          `UPDATE residents
           SET relationship_to_head = 'Khác'
           WHERE id = ?`,
          [household.head_resident_id],
        );
      }
      await connection.query(
        `UPDATE households
         SET head_resident_id = ?
         WHERE id = ?`,
        [residentId, household.id],
      );
    }

    await connection.query(
      `UPDATE residents
       SET full_name = ?,
           birth_date = ?,
           cccd = ?,
           relationship_to_head = ?
       WHERE id = ?`,
      [
        input.fullName,
        input.birthDate,
        input.cccd || null,
        input.relationship,
        residentId,
      ],
    );

    const resident = await getResidentById(residentId, connection);
    await connection.commit();
    return { resident };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteResidentById(residentId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [residents] = await connection.query(
      `SELECT id, household_id, full_name, relationship_to_head
       FROM residents
       WHERE id = ?
       FOR UPDATE`,
      [residentId],
    );
    if (!residents[0]) {
      await connection.rollback();
      return { reason: "RESIDENT_NOT_FOUND" };
    }

    const current = residents[0];
    const [households] = await connection.query(
      `SELECT id, head_resident_id
       FROM households
       WHERE id = ?
       FOR UPDATE`,
      [current.household_id],
    );
    const household = households[0];

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS n
       FROM residents
       WHERE household_id = ?`,
      [current.household_id],
    );
    const memberCount = Number(countRows[0]?.n || 0);

    if (
      (current.relationship_to_head === "Chủ hộ" ||
        household?.head_resident_id === residentId) &&
      memberCount > 1
    ) {
      await connection.rollback();
      return { reason: "CANNOT_DELETE_HEAD_WITH_MEMBERS" };
    }

    if (memberCount <= 1 && household) {
      await connection.query(
        `UPDATE households
         SET head_resident_id = NULL
         WHERE id = ?`,
        [household.id],
      );
      await connection.query(
        `DELETE FROM residents
         WHERE id = ?`,
        [residentId],
      );
      await connection.query(
        `DELETE FROM households
         WHERE id = ?`,
        [household.id],
      );
    } else {
      await connection.query(
        `DELETE FROM residents
         WHERE id = ?`,
        [residentId],
      );
    }

    await connection.commit();
    return { fullName: current.full_name };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
