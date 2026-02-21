import pool from "../configs/db.js";

const TABLE = "driver_status_logs";

function getDb(conn) {
  return conn || pool;
}

export async function create(payload, conn) {
  const db = getDb(conn);
  const [result] = await db.execute(
    `
      INSERT INTO ${TABLE} (
        driver_id,
        trip_id,
        previous_status,
        new_status,
        changed_reason,
        remarks,
        incident_type,
        incident_description,
        safety_score_before,
        safety_score_after,
        changed_at,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.driver_id,
      payload.trip_id ?? null,
      payload.previous_status,
      payload.new_status,
      payload.changed_reason,
      payload.remarks ?? null,
      payload.incident_type ?? null,
      payload.incident_description ?? null,
      payload.safety_score_before ?? null,
      payload.safety_score_after ?? null,
      payload.changed_at ?? new Date(),
      payload.created_by ?? null,
      payload.updated_by ?? payload.created_by ?? null,
    ],
  );

  return result.insertId;
}

export async function updateDriver(driverId, status, safetyScore, conn) {
  const db = getDb(conn);

  if (safetyScore === undefined) {
    await db.execute(
      `
        UPDATE drivers
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE driver_id = ?
          AND is_deleted = 0
      `,
      [status, driverId],
    );
    return;
  }

  await db.execute(
    `
      UPDATE drivers
      SET status = ?, safety_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE driver_id = ?
        AND is_deleted = 0
    `,
    [status, safetyScore, driverId],
  );
}

export async function findAll(filters = {}, page = 1, limit = 20) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = ["dsl.is_deleted = 0"];
  const values = [];

  if (filters.driver_id) {
    clauses.push("dsl.driver_id = ?");
    values.push(filters.driver_id);
  }
  if (filters.trip_id) {
    clauses.push("dsl.trip_id = ?");
    values.push(filters.trip_id);
  }
  if (filters.changed_reason) {
    clauses.push("dsl.changed_reason = ?");
    values.push(filters.changed_reason);
  }
  if (filters.incident_type) {
    clauses.push("dsl.incident_type = ?");
    values.push(filters.incident_type);
  }
  if (filters.from_date) {
    clauses.push("DATE(dsl.changed_at) >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("DATE(dsl.changed_at) <= ?");
    values.push(filters.to_date);
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;

  const [rows] = await pool.execute(
    `
      SELECT
        dsl.*,
        d.full_name AS driver_name,
        t.trip_code
      FROM ${TABLE} dsl
      LEFT JOIN drivers d ON d.driver_id = dsl.driver_id
      LEFT JOIN trips t ON t.trip_id = dsl.trip_id
      ${whereSql}
      ORDER BY dsl.changed_at DESC, dsl.driver_status_log_id DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `,
    values,
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${TABLE} dsl ${whereSql}`,
    values,
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        dsl.*,
        d.full_name AS driver_name,
        t.trip_code
      FROM ${TABLE} dsl
      LEFT JOIN drivers d ON d.driver_id = dsl.driver_id
      LEFT JOIN trips t ON t.trip_id = dsl.trip_id
      WHERE dsl.driver_status_log_id = ?
        AND dsl.is_deleted = 0
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

export async function findByDriverId(driverId, filters = {}, page = 1, limit = 20) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = ["dsl.is_deleted = 0", "dsl.driver_id = ?"];
  const values = [driverId];

  if (filters.from_date) {
    clauses.push("DATE(dsl.changed_at) >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("DATE(dsl.changed_at) <= ?");
    values.push(filters.to_date);
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;

  const [rows] = await pool.execute(
    `
      SELECT
        dsl.*,
        d.full_name AS driver_name,
        t.trip_code
      FROM ${TABLE} dsl
      LEFT JOIN drivers d ON d.driver_id = dsl.driver_id
      LEFT JOIN trips t ON t.trip_id = dsl.trip_id
      ${whereSql}
      ORDER BY dsl.changed_at DESC, dsl.driver_status_log_id DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `,
    values,
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${TABLE} dsl ${whereSql}`,
    values,
  );

  return { rows, total: countRows[0].total };
}

export async function getDriverCurrentStatus(driverId) {
  const [rows] = await pool.execute(
    `
      SELECT status
      FROM drivers
      WHERE driver_id = ?
        AND is_deleted = 0
      LIMIT 1
    `,
    [driverId],
  );

  return rows.length ? rows[0].status : null;
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
      WHERE driver_status_log_id = ?
        AND is_deleted = 0
    `,
    [updatedBy, id],
  );
}
