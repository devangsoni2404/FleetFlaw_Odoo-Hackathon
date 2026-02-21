import { z } from 'zod';

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const DRIVER_LICENSE_TYPES = ['Truck', 'Van', 'Bike'];
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Out of Service'];
const VEHICLE_TYPES = ['Truck', 'Van', 'Bike'];

const asMiddleware = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      })),
    });
  }

  req[source] = parsed.data;
  return next();
};

const driverCreateSchema = z.object({
  user_id: z.coerce.number().int().positive().optional(),
  full_name: z.string().trim().min(1, 'full_name is required'),
  phone: z.string().trim().min(1, 'phone is required'),
  email: z.string().email('Invalid email format').optional(),
  profile_photo_url: z.string().url('profile_photo_url must be a valid URL').optional(),
  license_number: z.string().trim().min(1, 'license_number is required'),
  license_type: z.enum(DRIVER_LICENSE_TYPES, {
    error: `license_type must be one of: ${DRIVER_LICENSE_TYPES.join(', ')}`,
  }),
  license_expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'license_expiry_date must be in YYYY-MM-DD format'),
  is_license_valid: z.coerce.boolean().optional(),
  status: z
    .enum(DRIVER_STATUSES, {
      error: `status must be one of: ${DRIVER_STATUSES.join(', ')}`,
    })
    .optional(),
});

const driverUpdateSchema = z
  .object({
    user_id: z.coerce.number().int().positive().optional(),
    full_name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    email: z.string().email('Invalid email format').optional(),
    profile_photo_url: z.string().url('profile_photo_url must be a valid URL').optional(),
    license_number: z.string().trim().min(1).optional(),
    license_type: z
      .enum(DRIVER_LICENSE_TYPES, {
        error: `license_type must be one of: ${DRIVER_LICENSE_TYPES.join(', ')}`,
      })
      .optional(),
    license_expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'license_expiry_date must be in YYYY-MM-DD format').optional(),
    is_license_valid: z.coerce.boolean().optional(),
    status: z
      .enum(DRIVER_STATUSES, {
        error: `status must be one of: ${DRIVER_STATUSES.join(', ')}`,
      })
      .optional(),
    updated_by: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (body) =>
      [
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
      ].some((key) => body[key] !== undefined),
    {
    message: 'No update fields provided',
    }
  );

const driverStatusSchema = z.object({
  status: z.enum(DRIVER_STATUSES, {
    error: `status must be one of: ${DRIVER_STATUSES.join(', ')}`,
  }),
  updated_by: z.coerce.number().int().positive().optional(),
});

const safetyScoreSchema = z.object({
  safety_score: z.coerce.number().min(0, 'safety_score must be between 0 and 100').max(100, 'safety_score must be between 0 and 100'),
  updated_by: z.coerce.number().int().positive().optional(),
});

const maxAllowedYear = new Date().getFullYear() + 1;

const vehicleCreateSchema = z.object({
  license_plate: z.string().trim().min(1, 'license_plate is required'),
  make: z.string().trim().min(1, 'make is required'),
  model: z.string().trim().min(1, 'model is required'),
  year: z.coerce.number().int().min(1900).max(maxAllowedYear),
  type: z.enum(VEHICLE_TYPES, {
    error: `type must be one of: ${VEHICLE_TYPES.join(', ')}`,
  }),
  max_load_kg: z.coerce.number(),
  fuel_tank_liters: z.coerce.number(),
  odometer_km: z.coerce.number().optional(),
  acquisition_cost: z.coerce.number(),
  status: z
    .enum(VEHICLE_STATUSES, {
      error: `status must be one of: ${VEHICLE_STATUSES.join(', ')}`,
    })
    .optional(),
  created_by: z.coerce.number().int().positive().optional(),
});

const vehicleUpdateSchema = z
  .object({
    license_plate: z.string().trim().min(1).optional(),
    make: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    year: z.coerce.number().int().min(1900).max(maxAllowedYear).optional(),
    type: z
      .enum(VEHICLE_TYPES, {
        error: `type must be one of: ${VEHICLE_TYPES.join(', ')}`,
      })
      .optional(),
    max_load_kg: z.coerce.number().optional(),
    fuel_tank_liters: z.coerce.number().optional(),
    odometer_km: z.coerce.number().optional(),
    acquisition_cost: z.coerce.number().optional(),
    status: z
      .enum(VEHICLE_STATUSES, {
        error: `status must be one of: ${VEHICLE_STATUSES.join(', ')}`,
      })
      .optional(),
    updated_by: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (body) =>
      [
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
      ].some((key) => body[key] !== undefined),
    {
    message: 'No update fields provided',
    }
  );

const vehicleStatusSchema = z.object({
  status: z.enum(VEHICLE_STATUSES, {
    error: `status must be one of: ${VEHICLE_STATUSES.join(', ')}`,
  }),
  updated_by: z.coerce.number().int().positive().optional(),
});

export const validateIdParam = (paramName = 'id') =>
  asMiddleware(
    z.object({
      [paramName]: z.coerce.number().int().positive(`${paramName} must be a positive integer`),
    }),
    'params'
  );
export const validateDriverCreate = asMiddleware(driverCreateSchema, 'body');
export const validateDriverUpdate = asMiddleware(driverUpdateSchema, 'body');
export const validateDriverStatusUpdate = asMiddleware(driverStatusSchema, 'body');
export const validateSafetyScoreUpdate = asMiddleware(safetyScoreSchema, 'body');
export const validateVehicleCreate = asMiddleware(vehicleCreateSchema, 'body');
export const validateVehicleUpdate = asMiddleware(vehicleUpdateSchema, 'body');
export const validateVehicleStatusUpdate = asMiddleware(vehicleStatusSchema, 'body');
