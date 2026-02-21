const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const DRIVER_LICENSE_TYPES = ['Truck', 'Van', 'Bike'];
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Out of Service'];
const VEHICLE_TYPES = ['Truck', 'Van', 'Bike'];

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
};

const pushError = (errors, field, message) => {
  errors.push({ field, message });
};

const sendValidationError = (res, errors) =>
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });

export const validateIdParam = (paramName = 'id') => (req, res, next) => {
  const value = Number.parseInt(req.params[paramName], 10);
  if (Number.isNaN(value) || value <= 0) {
    return res.status(400).json({ success: false, message: `Invalid ${paramName}` });
  }
  return next();
};

export const validateDriverCreate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!body.full_name || typeof body.full_name !== 'string') {
    pushError(errors, 'full_name', 'full_name is required');
  }
  if (!body.phone || typeof body.phone !== 'string') {
    pushError(errors, 'phone', 'phone is required');
  }
  if (!body.license_number || typeof body.license_number !== 'string') {
    pushError(errors, 'license_number', 'license_number is required');
  }
  if (!DRIVER_LICENSE_TYPES.includes(body.license_type)) {
    pushError(errors, 'license_type', `license_type must be one of: ${DRIVER_LICENSE_TYPES.join(', ')}`);
  }
  if (!isValidDateString(body.license_expiry_date)) {
    pushError(errors, 'license_expiry_date', 'license_expiry_date must be in YYYY-MM-DD format');
  }
  if (body.status !== undefined && !DRIVER_STATUSES.includes(body.status)) {
    pushError(errors, 'status', `status must be one of: ${DRIVER_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return sendValidationError(res, errors);
  }
  return next();
};

export const validateDriverUpdate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  const hasAnyField = [
    'user_id',
    'full_name',
    'phone',
    'email',
    'profile_photo_url',
    'license_number',
    'license_type',
    'license_expiry_date',
    'is_license_valid',
    'status',
  ].some((key) => body[key] !== undefined);

  if (!hasAnyField) {
    pushError(errors, 'body', 'No update fields provided');
  }
  if (body.license_type !== undefined && !DRIVER_LICENSE_TYPES.includes(body.license_type)) {
    pushError(errors, 'license_type', `license_type must be one of: ${DRIVER_LICENSE_TYPES.join(', ')}`);
  }
  if (body.license_expiry_date !== undefined && !isValidDateString(body.license_expiry_date)) {
    pushError(errors, 'license_expiry_date', 'license_expiry_date must be in YYYY-MM-DD format');
  }
  if (body.status !== undefined && !DRIVER_STATUSES.includes(body.status)) {
    pushError(errors, 'status', `status must be one of: ${DRIVER_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return sendValidationError(res, errors);
  }
  return next();
};

export const validateDriverStatusUpdate = (req, res, next) => {
  const { status } = req.body || {};
  if (!DRIVER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${DRIVER_STATUSES.join(', ')}`,
    });
  }
  return next();
};

export const validateSafetyScoreUpdate = (req, res, next) => {
  const score = Number.parseFloat(req.body?.safety_score);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    return res.status(400).json({
      success: false,
      message: 'safety_score must be a number between 0 and 100',
    });
  }
  return next();
};

export const validateVehicleCreate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  const currentYear = new Date().getFullYear() + 1;

  if (!body.license_plate || typeof body.license_plate !== 'string') {
    pushError(errors, 'license_plate', 'license_plate is required');
  }
  if (!body.make || typeof body.make !== 'string') {
    pushError(errors, 'make', 'make is required');
  }
  if (!body.model || typeof body.model !== 'string') {
    pushError(errors, 'model', 'model is required');
  }
  const year = Number.parseInt(body.year, 10);
  if (Number.isNaN(year) || year < 1900 || year > currentYear) {
    pushError(errors, 'year', `year must be between 1900 and ${currentYear}`);
  }
  if (!VEHICLE_TYPES.includes(body.type)) {
    pushError(errors, 'type', `type must be one of: ${VEHICLE_TYPES.join(', ')}`);
  }
  if (Number.isNaN(Number.parseFloat(body.max_load_kg))) {
    pushError(errors, 'max_load_kg', 'max_load_kg must be a number');
  }
  if (Number.isNaN(Number.parseFloat(body.fuel_tank_liters))) {
    pushError(errors, 'fuel_tank_liters', 'fuel_tank_liters must be a number');
  }
  if (Number.isNaN(Number.parseFloat(body.acquisition_cost))) {
    pushError(errors, 'acquisition_cost', 'acquisition_cost must be a number');
  }
  if (body.status !== undefined && !VEHICLE_STATUSES.includes(body.status)) {
    pushError(errors, 'status', `status must be one of: ${VEHICLE_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return sendValidationError(res, errors);
  }
  return next();
};

export const validateVehicleUpdate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  const currentYear = new Date().getFullYear() + 1;

  const hasAnyField = [
    'license_plate',
    'make',
    'model',
    'year',
    'type',
    'max_load_kg',
    'fuel_tank_liters',
    'odometer_km',
    'acquisition_cost',
    'status',
  ].some((key) => body[key] !== undefined);

  if (!hasAnyField) {
    pushError(errors, 'body', 'No update fields provided');
  }
  if (body.year !== undefined) {
    const year = Number.parseInt(body.year, 10);
    if (Number.isNaN(year) || year < 1900 || year > currentYear) {
      pushError(errors, 'year', `year must be between 1900 and ${currentYear}`);
    }
  }
  if (body.type !== undefined && !VEHICLE_TYPES.includes(body.type)) {
    pushError(errors, 'type', `type must be one of: ${VEHICLE_TYPES.join(', ')}`);
  }
  if (body.status !== undefined && !VEHICLE_STATUSES.includes(body.status)) {
    pushError(errors, 'status', `status must be one of: ${VEHICLE_STATUSES.join(', ')}`);
  }

  if (errors.length) {
    return sendValidationError(res, errors);
  }
  return next();
};

export const validateVehicleStatusUpdate = (req, res, next) => {
  const { status } = req.body || {};
  if (!VEHICLE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VEHICLE_STATUSES.join(', ')}`,
    });
  }
  return next();
};
