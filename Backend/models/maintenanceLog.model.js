import pool from "../configs/db.js";

const TABLE = "maintenance_logs";

function getDb(conn) {
  return conn || pool;
}

export function generateCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MNT-${Date.now().toString().slice(-6)}-${random}`;
}

export async function create(payload, conn) {
  const db = getDb(conn);
  const sql = `
    INSERT INTO ${TABLE} (
      maintenance_code,
      vehicle_id,
      service_type,
      service_description,
      service_provider,
      service_provider_phone,
      service_date,
      expected_completion,
      actual_completion,
      labour_cost,
      parts_cost,
      odometer_at_service,
      status,
      completion_notes,
      next_service_due_km,
      next_service_due_date,
      created_by,
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    payload.maintenance_code,
    payload.vehicle_id,
    payload.service_type,
    payload.service_description ?? null,
    payload.service_provider ?? null,
    payload.service_provider_phone ?? null,
    payload.service_date,
    payload.expected_completion,
    payload.actual_completion ?? null,
    payload.labour_cost ?? 0,
    payload.parts_cost ?? 0,
    payload.odometer_at_service,
    payload.status ?? "Scheduled",
    payload.completion_notes ?? null,
    payload.next_service_due_km ?? null,
    payload.next_service_due_date ?? null,
    payload.created_by ?? null,
    payload.updated_by ?? payload.created_by ?? null,
  ];

  const [result] = await db.execute(sql, params);
  return result.insertId;
}

export async function findAll(filters = {}, page = 1, limit = 20) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = ["m.is_deleted = 0"];
  const values = [];

  if (filters.vehicle_id) {
    clauses.push("m.vehicle_id = ?");
    values.push(filters.vehicle_id);
  }
  if (filters.status) {
    clauses.push("m.status = ?");
    values.push(filters.status);
  }
  if (filters.service_type) {
    clauses.push("m.service_type = ?");
    values.push(filters.service_type);
  }
  if (filters.from_date) {
    clauses.push("m.service_date >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("m.service_date <= ?");
    values.push(filters.to_date);
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;

  const [rows] = await pool.execute(
    `
      SELECT
        m.*,
        v.license_plate,
        v.make,
        v.model
      FROM ${TABLE} m
      LEFT JOIN vehicles v ON v.vehicle_id = m.vehicle_id
      ${whereSql}
      ORDER BY m.service_date DESC, m.maintenance_id DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `,
    values,
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${TABLE} m ${whereSql}`,
    values,
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        m.*,
        v.license_plate,
        v.make,
        v.model
      FROM ${TABLE} m
      LEFT JOIN vehicles v ON v.vehicle_id = m.vehicle_id
      WHERE m.maintenance_id = ?
        AND m.is_deleted = 0
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

export async function update(id, patch, conn) {
  const db = getDb(conn);
  const allowedFields = [
    "service_type",
    "service_description",
    "service_provider",
    "service_provider_phone",
    "service_date",
    "expected_completion",
    "actual_completion",
    "labour_cost",
    "parts_cost",
    "odometer_at_service",
    "completion_notes",
    "next_service_due_km",
    "next_service_due_date",
    "updated_by",
  ];

  const entries = Object.entries(patch).filter(
    ([key, value]) => allowedFields.includes(key) && value !== undefined,
  );

  if (!entries.length) {
    return;
  }

  const sql = `
    UPDATE ${TABLE}
    SET ${entries.map(([key]) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE maintenance_id = ?
      AND is_deleted = 0
  `;

  const params = entries.map(([, value]) => value);
  params.push(id);

  await db.execute(sql, params);
}

export async function updateStatus(id, status, meta = {}, conn) {
  const db = getDb(conn);
  await db.execute(
    `
      UPDATE ${TABLE}
      SET
        status = ?,
        actual_completion = ?,
        completion_notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE maintenance_id = ?
        AND is_deleted = 0
    `,
    [
      status,
      meta.actual_completion ?? null,
      meta.completion_notes ?? null,
      meta.updated_by ?? null,
      id,
    ],
  );
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
      WHERE maintenance_id = ?
        AND is_deleted = 0
    `,
    [updatedBy, id],
  );
}
