import pool from "../configs/db.js";

const TABLE = "fuel_logs";

function getDb(conn) {
  return conn || pool;
}

export function generateCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FUL-${Date.now().toString().slice(-6)}-${random}`;
}

export async function create(payload, conn) {
  const db = getDb(conn);
  const [result] = await db.execute(
    `
      INSERT INTO ${TABLE} (
        fuel_log_code,
        vehicle_id,
        trip_id,
        driver_id,
        fuel_type,
        liters_filled,
        price_per_liter,
        odometer_at_fuel,
        fuel_station_name,
        fuel_station_city,
        receipt_number,
        receipt_photo_url,
        fueled_at,
        created_by,
        updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.fuel_log_code,
      payload.vehicle_id,
      payload.trip_id,
      payload.driver_id,
      payload.fuel_type,
      payload.liters_filled,
      payload.price_per_liter,
      payload.odometer_at_fuel,
      payload.fuel_station_name ?? null,
      payload.fuel_station_city ?? null,
      payload.receipt_number ?? null,
      payload.receipt_photo_url ?? null,
      payload.fueled_at,
      payload.created_by ?? null,
      payload.updated_by ?? payload.created_by ?? null,
    ],
  );

  return result.insertId;
}

export async function findAll(filters = {}, page = 1, limit = 20) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = ["f.is_deleted = 0"];
  const values = [];

  if (filters.vehicle_id) {
    clauses.push("f.vehicle_id = ?");
    values.push(filters.vehicle_id);
  }
  if (filters.trip_id) {
    clauses.push("f.trip_id = ?");
    values.push(filters.trip_id);
  }
  if (filters.driver_id) {
    clauses.push("f.driver_id = ?");
    values.push(filters.driver_id);
  }
  if (filters.fuel_type) {
    clauses.push("f.fuel_type = ?");
    values.push(filters.fuel_type);
  }
  if (filters.from_date) {
    clauses.push("DATE(f.fueled_at) >= ?");
    values.push(filters.from_date);
  }
  if (filters.to_date) {
    clauses.push("DATE(f.fueled_at) <= ?");
    values.push(filters.to_date);
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;

  const [rows] = await pool.execute(
    `
      SELECT
        f.*,
        v.license_plate,
        d.full_name AS driver_name,
        t.trip_code
      FROM ${TABLE} f
      LEFT JOIN vehicles v ON v.vehicle_id = f.vehicle_id
      LEFT JOIN drivers d ON d.driver_id = f.driver_id
      LEFT JOIN trips t ON t.trip_id = f.trip_id
      ${whereSql}
      ORDER BY f.fueled_at DESC, f.fuel_log_id DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `,
    values,
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM ${TABLE} f ${whereSql}`,
    values,
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        f.*,
        v.license_plate,
        d.full_name AS driver_name,
        t.trip_code
      FROM ${TABLE} f
      LEFT JOIN vehicles v ON v.vehicle_id = f.vehicle_id
      LEFT JOIN drivers d ON d.driver_id = f.driver_id
      LEFT JOIN trips t ON t.trip_id = f.trip_id
      WHERE f.fuel_log_id = ?
        AND f.is_deleted = 0
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

export async function update(id, patch, conn) {
  const db = getDb(conn);
  const allowedFields = [
    "fuel_type",
    "liters_filled",
    "price_per_liter",
    "odometer_at_fuel",
    "fuel_station_name",
    "fuel_station_city",
    "receipt_number",
    "receipt_photo_url",
    "fueled_at",
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
    WHERE fuel_log_id = ?
      AND is_deleted = 0
  `;

  const params = entries.map(([, value]) => value);
  params.push(id);

  await db.execute(sql, params);
}

export async function recalcTripFuelCost(tripId, conn) {
  const db = getDb(conn);
  await db.execute(
    `
      UPDATE trips t
      LEFT JOIN (
        SELECT trip_id, COALESCE(SUM(total_fuel_cost), 0) AS total
        FROM fuel_logs
        WHERE trip_id = ?
          AND is_deleted = 0
        GROUP BY trip_id
      ) f ON f.trip_id = t.trip_id
      SET t.total_fuel_cost = COALESCE(f.total, 0), t.updated_at = CURRENT_TIMESTAMP
      WHERE t.trip_id = ?
        AND t.is_deleted = 0
    `,
    [tripId, tripId],
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
      WHERE fuel_log_id = ?
        AND is_deleted = 0
    `,
    [updatedBy, id],
  );
}
