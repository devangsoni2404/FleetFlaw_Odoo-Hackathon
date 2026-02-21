import pool from "../configs/db.js";

const TABLE = "vehicle_status_logs";

function getDb(conn) {
  return conn || pool;
}

export async function create(payload, conn) {
  const db = getDb(conn);
  const [result] = await db.execute(
    `
      INSERT INTO ${TABLE} (
        vehicle_id,
        trip_id,
        maintenance_id,
        previous_status,
        new_status,
        changed_reason,
        remarks,
        odometer_at_change,
        changed_at,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.vehicle_id,
      payload.trip_id ?? null,
      payload.maintenance_id ?? null,
      payload.previous_status,
      payload.new_status,
      payload.changed_reason,
      payload.remarks ?? null,
      payload.odometer_at_change,
      payload.changed_at ?? new Date(),
      payload.created_by ?? null,
      payload.updated_by ?? payload.created_by ?? null,
    ],
  );

  return result.insertId;
}

export async function updateVehicle(vehicleId, status, conn) {
  const db = getDb(conn);
  await db.execute(
    `
      UPDATE vehicles
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = ?
        AND is_deleted = 0
    `,
    [status, vehicleId],
  );
}

export async function getVehicleCurrent(vehicleId) {
  const [rows] = await pool.execute(
    `
      SELECT vehicle_id, status, odometer_km
      FROM vehicles
      WHERE vehicle_id = ?
        AND is_deleted = 0
      LIMIT 1
    `,
    [vehicleId],
  );

  return rows[0] || null;
}

export async function findAll(filters = {}, page = 1, limit = 20) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = ["vsl.is_deleted = 0"];
  const values = [];

  if (filters.vehicle_id) {
    clauses.push("vsl.vehicle_id = ?");
    values.push(filters.vehicle_id);
  }
  if (filters.trip_id) {
    clauses.push("vsl.trip_id = ?");
    values.push(filters.trip_id);
  }
  if (filters.maintenance_id) {
    clauses.push("vsl.maintenance_id = ?");
    values.push(filters.maintenance_id);
  }
  if (filters.changed_reason) {
    clauses.push("vsl.changed_reason = ?");
    values.push(filters.changed_reason);
  }
  if (filters.from_date) {
    clauses.push("DATE(vsl.changed_at) >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("DATE(vsl.changed_at) <= ?");
    values.push(filters.to_date);
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;

  const [rows] = await pool.execute(
    `
      SELECT
        vsl.*,
        v.license_plate,
        t.trip_code,
        m.maintenance_code
      FROM ${TABLE} vsl
      LEFT JOIN vehicles v ON v.vehicle_id = vsl.vehicle_id
      LEFT JOIN trips t ON t.trip_id = vsl.trip_id
      LEFT JOIN maintenance_logs m ON m.maintenance_id = vsl.maintenance_id
      ${whereSql}
      ORDER BY vsl.changed_at DESC, vsl.vehicle_status_log_id DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `,
    values,
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${TABLE} vsl ${whereSql}`,
    values,
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        vsl.*,
        v.license_plate,
        t.trip_code,
        m.maintenance_code
      FROM ${TABLE} vsl
      LEFT JOIN vehicles v ON v.vehicle_id = vsl.vehicle_id
      LEFT JOIN trips t ON t.trip_id = vsl.trip_id
      LEFT JOIN maintenance_logs m ON m.maintenance_id = vsl.maintenance_id
      WHERE vsl.vehicle_status_log_id = ?
        AND vsl.is_deleted = 0
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

export async function findByVehicleId(vehicleId, filters = {}, page = 1, limit = 20) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = ["vsl.is_deleted = 0", "vsl.vehicle_id = ?"];
  const values = [vehicleId];

  if (filters.from_date) {
    clauses.push("DATE(vsl.changed_at) >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("DATE(vsl.changed_at) <= ?");
    values.push(filters.to_date);
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;

  const [rows] = await pool.execute(
    `
      SELECT
        vsl.*,
        v.license_plate,
        t.trip_code,
        m.maintenance_code
      FROM ${TABLE} vsl
      LEFT JOIN vehicles v ON v.vehicle_id = vsl.vehicle_id
      LEFT JOIN trips t ON t.trip_id = vsl.trip_id
      LEFT JOIN maintenance_logs m ON m.maintenance_id = vsl.maintenance_id
      ${whereSql}
      ORDER BY vsl.changed_at DESC, vsl.vehicle_status_log_id DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `,
    values,
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${TABLE} vsl ${whereSql}`,
    values,
  );

  return { rows, total: countRows[0].total };
}

export async function softDelete(id, updatedBy = null, conn) {
  const db = getDb(conn);
  await db.execute(
    `
      UPDATE ${TABLE}
      SET
        is_deleted = 1,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_status_log_id = ?
        AND is_deleted = 0
    `,
    [updatedBy, id],
  );
}
