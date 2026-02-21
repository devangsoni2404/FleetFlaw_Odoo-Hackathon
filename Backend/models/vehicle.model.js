import db from '../configs/db.js';

const VEHICLE_TYPES = ['Truck', 'Van', 'Bike'];
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Out of Service'];

const normalizeVehicle = (row) => ({
  vehicle_id: row.vehicle_id,
  license_plate: row.license_plate,
  make: row.make,
  model: row.model,
  year: row.year,
  type: row.type,
  max_load_kg: row.max_load_kg,
  fuel_tank_liters: row.fuel_tank_liters,
  odometer_km: row.odometer_km,
  acquisition_cost: row.acquisition_cost,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

const selectColumns = `
  SELECT vehicle_id, license_plate, make, model, year, type,
         max_load_kg, fuel_tank_liters, odometer_km, acquisition_cost,
         status, created_at, updated_at, created_by, updated_by, is_deleted
  FROM vehicles
`;

export const getAllVehicles = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `${selectColumns}
     WHERE (? = 1 OR is_deleted = 0)
     ORDER BY vehicle_id ASC`,
    [includeDeleted ? 1 : 0]
  );

  return rows.map(normalizeVehicle);
};

export const getVehicleById = async (vehicleId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `${selectColumns}
     WHERE vehicle_id = ? AND (? = 1 OR is_deleted = 0)
     LIMIT 1`,
    [vehicleId, includeDeleted ? 1 : 0]
  );

  return rows.length ? normalizeVehicle(rows[0]) : null;
};

export const getVehicleByLicensePlate = async (licensePlate) => {
  const [rows] = await db.execute(
    `SELECT vehicle_id FROM vehicles WHERE license_plate = ? AND is_deleted = 0 LIMIT 1`,
    [licensePlate]
  );

  return rows.length ? rows[0] : null;
};

export const createVehicle = async ({
  licensePlate,
  make,
  model,
  year,
  type,
  maxLoadKg,
  fuelTankLiters,
  odometerKm,
  acquisitionCost,
  status,
  actorId,
}) => {
  const [result] = await db.execute(
    `INSERT INTO vehicles (
      license_plate, make, model, year, type,
      max_load_kg, fuel_tank_liters, odometer_km,
      acquisition_cost, status, created_by, updated_by, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      licensePlate,
      make,
      model,
      year,
      type,
      maxLoadKg,
      fuelTankLiters,
      odometerKm ?? 0,
      acquisitionCost,
      status ?? 'Available',
      actorId ?? null,
      actorId ?? null,
    ]
  );

  return getVehicleById(result.insertId, true);
};

export const updateVehicle = async ({
  vehicleId,
  licensePlate,
  make,
  model,
  year,
  type,
  maxLoadKg,
  fuelTankLiters,
  odometerKm,
  acquisitionCost,
  status,
  actorId,
}) => {
  const fields = [];
  const values = [];

  if (licensePlate !== undefined) {
    fields.push('license_plate = ?');
    values.push(licensePlate);
  }
  if (make !== undefined) {
    fields.push('make = ?');
    values.push(make);
  }
  if (model !== undefined) {
    fields.push('model = ?');
    values.push(model);
  }
  if (year !== undefined) {
    fields.push('year = ?');
    values.push(year);
  }
  if (type !== undefined) {
    fields.push('type = ?');
    values.push(type);
  }
  if (maxLoadKg !== undefined) {
    fields.push('max_load_kg = ?');
    values.push(maxLoadKg);
  }
  if (fuelTankLiters !== undefined) {
    fields.push('fuel_tank_liters = ?');
    values.push(fuelTankLiters);
  }
  if (odometerKm !== undefined) {
    fields.push('odometer_km = ?');
    values.push(odometerKm);
  }
  if (acquisitionCost !== undefined) {
    fields.push('acquisition_cost = ?');
    values.push(acquisitionCost);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }

  fields.push('updated_by = ?');
  values.push(actorId ?? null);
  fields.push('updated_at = CURRENT_TIMESTAMP');

  const [result] = await db.execute(
    `UPDATE vehicles
     SET ${fields.join(', ')}
     WHERE vehicle_id = ? AND is_deleted = 0`,
    [...values, vehicleId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getVehicleById(vehicleId, true);
};

export const updateVehicleStatus = async ({ vehicleId, status, actorId }) => {
  const [result] = await db.execute(
    `UPDATE vehicles
     SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE vehicle_id = ? AND is_deleted = 0`,
    [status, actorId ?? null, vehicleId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getVehicleById(vehicleId, true);
};

export const logVehicleStatus = async ({ vehicleId, status, changedReason, actorId }) => {
  const [result] = await db.execute(
    `INSERT INTO vehicle_status_logs (vehicle_id, status, changed_reason, created_by)
     VALUES (?, ?, ?, ?)`,
    [vehicleId, status, changedReason, actorId ?? null]
  );

  return result.insertId;
};

export const softDeleteVehicle = async ({ vehicleId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE vehicles
     SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE vehicle_id = ? AND is_deleted = 0`,
    [actorId ?? null, vehicleId]
  );

  return result.affectedRows > 0;
};

export { VEHICLE_TYPES, VEHICLE_STATUSES };
