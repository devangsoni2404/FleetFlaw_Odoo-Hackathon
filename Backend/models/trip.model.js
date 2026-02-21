import db from '../configs/db.js';

const normalizeTrip = (row) => ({
  trip_id: row.trip_id,
  trip_code: row.trip_code,
  vehicle_id: row.vehicle_id,
  driver_id: row.driver_id,
  shipment_id: row.shipment_id,
  origin_address: row.origin_address,
  destination_address: row.destination_address,
  estimated_distance_km: row.estimated_distance_km,
  actual_distance_km: row.actual_distance_km,
  odometer_start_km: row.odometer_start_km,
  odometer_end_km: row.odometer_end_km,
  cargo_weight_kg: row.cargo_weight_kg,
  scheduled_start: row.scheduled_start,
  scheduled_end: row.scheduled_end,
  actual_start: row.actual_start,
  actual_end: row.actual_end,
  estimated_fuel_liters: row.estimated_fuel_liters,
  estimated_fuel_cost: row.estimated_fuel_cost,
  total_fuel_cost: row.total_fuel_cost,
  total_expense_cost: row.total_expense_cost,
  total_trip_cost: row.total_trip_cost,
  status: row.status,
  cancelled_reason: row.cancelled_reason,
  cancelled_at: row.cancelled_at,
  cancelled_by: row.cancelled_by,
  completed_at: row.completed_at,
  completion_notes: row.completion_notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

export const getAllTrips = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `SELECT * FROM trips WHERE (? = 1 OR is_deleted = 0) ORDER BY created_at DESC`,
    [includeDeleted ? 1 : 0]
  );
  return rows.map(normalizeTrip);
};

export const getTripById = async (tripId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `SELECT * FROM trips WHERE trip_id = ? AND (? = 1 OR is_deleted = 0) LIMIT 1`,
    [tripId, includeDeleted ? 1 : 0]
  );
  return rows.length ? normalizeTrip(rows[0]) : null;
};

export const createTrip = async (tripData) => {
  const fields = Object.keys(tripData);
  const placeholders = fields.map(() => '?').join(', ');
  const values = Object.values(tripData);

  const [result] = await db.execute(
    `INSERT INTO trips (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return getTripById(result.insertId, true);
};

export const updateTrip = async (tripId, tripData) => {
  const fields = Object.keys(tripData);
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = [...Object.values(tripData), tripId];

  const [result] = await db.execute(
    `UPDATE trips SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND is_deleted = 0`,
    values
  );

  if (!result.affectedRows) return null;
  return getTripById(tripId, true);
};

export const softDeleteTrip = async (tripId, actorId) => {
  const [result] = await db.execute(
    `UPDATE trips SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND is_deleted = 0`,
    [actorId ?? null, tripId]
  );
  return result.affectedRows > 0;
};

export const updateTripExpenseCost = async (tripId) => {
  const [result] = await db.execute(
    `UPDATE trips t
     SET t.total_expense_cost = (
       SELECT COALESCE(SUM(amount), 0)
       FROM expenses
       WHERE trip_id = ? AND is_deleted = 0
     )
     WHERE t.trip_id = ?`,
    [tripId, tripId]
  );
  return result.affectedRows > 0;
};
