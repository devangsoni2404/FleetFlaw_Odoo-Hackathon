import db from '../configs/db.js';

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const LICENSE_TYPES = ['Truck', 'Van', 'Bike'];

const normalizeDriver = (row) => ({
  driver_id: row.driver_id,
  user_id: row.user_id,
  full_name: row.full_name,
  phone: row.phone,
  email: row.email,
  profile_photo_url: row.profile_photo_url,
  license_number: row.license_number,
  license_type: row.license_type,
  license_expiry_date: row.license_expiry_date,
  is_license_valid: Boolean(row.is_license_valid),
  total_trips: row.total_trips,
  completed_trips: row.completed_trips,
  safety_score: row.safety_score,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

const selectColumns = `
  SELECT driver_id, user_id, full_name, phone, email, profile_photo_url,
         license_number, license_type, license_expiry_date, is_license_valid,
         total_trips, completed_trips, safety_score, status,
         created_at, updated_at, created_by, updated_by, is_deleted
  FROM drivers
`;

export const getAllDrivers = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `${selectColumns}
     WHERE (? = 1 OR is_deleted = 0)
     ORDER BY driver_id ASC`,
    [includeDeleted ? 1 : 0]
  );

  return rows.map(normalizeDriver);
};

export const getDriverById = async (driverId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `${selectColumns}
     WHERE driver_id = ? AND (? = 1 OR is_deleted = 0)
     LIMIT 1`,
    [driverId, includeDeleted ? 1 : 0]
  );

  return rows.length ? normalizeDriver(rows[0]) : null;
};

export const getDriverByPhone = async (phone) => {
  const [rows] = await db.execute(
    `SELECT driver_id FROM drivers WHERE phone = ? AND is_deleted = 0 LIMIT 1`,
    [phone]
  );

  return rows.length ? rows[0] : null;
};

export const getDriverByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const [rows] = await db.execute(
    `SELECT driver_id FROM drivers WHERE email = ? AND is_deleted = 0 LIMIT 1`,
    [email]
  );

  return rows.length ? rows[0] : null;
};

export const getDriverByLicense = async (licenseNumber) => {
  const [rows] = await db.execute(
    `SELECT driver_id FROM drivers WHERE license_number = ? AND is_deleted = 0 LIMIT 1`,
    [licenseNumber]
  );

  return rows.length ? rows[0] : null;
};

export const createDriver = async ({
  userId,
  fullName,
  phone,
  email,
  profilePhotoUrl,
  licenseNumber,
  licenseType,
  licenseExpiryDate,
  isLicenseValid,
  status,
  actorId,
}) => {
  const [result] = await db.execute(
    `INSERT INTO drivers (
      user_id, full_name, phone, email, profile_photo_url,
      license_number, license_type, license_expiry_date,
      is_license_valid, status, created_by, updated_by, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      userId ?? null,
      fullName,
      phone,
      email ?? null,
      profilePhotoUrl ?? null,
      licenseNumber,
      licenseType,
      licenseExpiryDate,
      isLicenseValid === undefined ? 1 : isLicenseValid ? 1 : 0,
      status ?? 'Available',
      actorId ?? null,
      actorId ?? null,
    ]
  );

  return getDriverById(result.insertId, true);
};

export const updateDriver = async ({
  driverId,
  userId,
  fullName,
  phone,
  email,
  profilePhotoUrl,
  licenseNumber,
  licenseType,
  licenseExpiryDate,
  isLicenseValid,
  status,
  actorId,
}) => {
  const fields = [];
  const values = [];

  if (userId !== undefined) {
    fields.push('user_id = ?');
    values.push(userId);
  }
  if (fullName !== undefined) {
    fields.push('full_name = ?');
    values.push(fullName);
  }
  if (phone !== undefined) {
    fields.push('phone = ?');
    values.push(phone);
  }
  if (email !== undefined) {
    fields.push('email = ?');
    values.push(email);
  }
  if (profilePhotoUrl !== undefined) {
    fields.push('profile_photo_url = ?');
    values.push(profilePhotoUrl);
  }
  if (licenseNumber !== undefined) {
    fields.push('license_number = ?');
    values.push(licenseNumber);
  }
  if (licenseType !== undefined) {
    fields.push('license_type = ?');
    values.push(licenseType);
  }
  if (licenseExpiryDate !== undefined) {
    fields.push('license_expiry_date = ?');
    values.push(licenseExpiryDate);
  }
  if (isLicenseValid !== undefined) {
    fields.push('is_license_valid = ?');
    values.push(isLicenseValid ? 1 : 0);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }

  fields.push('updated_by = ?');
  values.push(actorId ?? null);
  fields.push('updated_at = CURRENT_TIMESTAMP');

  const [result] = await db.execute(
    `UPDATE drivers
     SET ${fields.join(', ')}
     WHERE driver_id = ? AND is_deleted = 0`,
    [...values, driverId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getDriverById(driverId, true);
};

export const updateDriverStatus = async ({ driverId, status, actorId }) => {
  const [result] = await db.execute(
    `UPDATE drivers
     SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE driver_id = ? AND is_deleted = 0`,
    [status, actorId ?? null, driverId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getDriverById(driverId, true);
};

export const logDriverStatus = async ({
  driverId,
  status,
  changedReason,
  actorId,
  tripId = null,
  previousStatus = null,
  remarks = null,
  incidentType = null,
  incidentDescription = null,
  safetyScoreBefore = null,
  safetyScoreAfter = null,
}) => {
  const currentDriver = await getDriverById(driverId, true);
  if (!currentDriver) {
    return null;
  }

  const resolvedPreviousStatus = previousStatus ?? currentDriver.status;
  const resolvedReason = changedReason ?? 'Other';

  const [result] = await db.execute(
    `INSERT INTO driver_status_logs (
      driver_id, trip_id, previous_status, new_status, changed_reason,
      remarks, incident_type, incident_description, safety_score_before, safety_score_after,
      created_by, updated_by, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      driverId,
      tripId,
      resolvedPreviousStatus,
      status,
      resolvedReason,
      remarks,
      incidentType,
      incidentDescription,
      safetyScoreBefore,
      safetyScoreAfter,
      actorId ?? null,
      actorId ?? null,
    ]
  );

  return result.insertId;
};

export const incrementDriverTrips = async (driverId) => {
  const [result] = await db.execute(
    `UPDATE drivers
     SET total_trips = total_trips + 1
     WHERE driver_id = ? AND is_deleted = 0`,
    [driverId]
  );

  return result.affectedRows > 0;
};

export const getExpiredDrivers = async () => {
  const [rows] = await db.execute(
    `${selectColumns}
     WHERE is_deleted = 0
       AND license_expiry_date < CURDATE()
     ORDER BY license_expiry_date ASC, driver_id ASC`
  );

  return rows.map(normalizeDriver);
};

export const updateDriverSafetyScore = async ({ driverId, safetyScore, actorId }) => {
  const [result] = await db.execute(
    `UPDATE drivers
     SET safety_score = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE driver_id = ? AND is_deleted = 0`,
    [safetyScore, actorId ?? null, driverId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getDriverById(driverId, true);
};

export const softDeleteDriver = async ({ driverId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE drivers
     SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE driver_id = ? AND is_deleted = 0`,
    [actorId ?? null, driverId]
  );

  return result.affectedRows > 0;
};

export { DRIVER_STATUSES, LICENSE_TYPES };
