import { z } from "zod";

const id = z.coerce.number().int().positive();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");
const dateTimeString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Use a valid datetime string",
});

const fuelType = z.enum(["Petrol", "Diesel", "CNG", "Electric"]);

export const listSchema = z.object({
  query: z.object({
    vehicle_id: id.optional(),
    trip_id: id.optional(),
    driver_id: id.optional(),
    fuel_type: fuelType.optional(),
    from_date: dateString.optional(),
    to_date: dateString.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id }),
});

export const createSchema = z.object({
  body: z.object({
    vehicle_id: id,
    trip_id: id,
    driver_id: id,
    fuel_type: fuelType,
    liters_filled: z.coerce.number().positive(),
    price_per_liter: z.coerce.number().positive(),
    odometer_at_fuel: z.coerce.number().min(0),
    fuel_station_name: z.string().max(150).optional(),
    fuel_station_city: z.string().max(100).optional(),
    receipt_number: z.string().max(100).optional(),
    receipt_photo_url: z.string().url().max(255).optional(),
    fueled_at: dateTimeString,
    created_by: id.optional().nullable(),
    updated_by: id.optional().nullable(),
  }),
});

export const updateSchema = z
  .object({
    params: z.object({ id }),
    body: z
      .object({
        fuel_type: fuelType.optional(),
        liters_filled: z.coerce.number().positive().optional(),
        price_per_liter: z.coerce.number().positive().optional(),
        odometer_at_fuel: z.coerce.number().min(0).optional(),
        fuel_station_name: z.string().max(150).optional().nullable(),
        fuel_station_city: z.string().max(100).optional().nullable(),
        receipt_number: z.string().max(100).optional().nullable(),
        receipt_photo_url: z.string().url().max(255).optional().nullable(),
        fueled_at: dateTimeString.optional(),
        updated_by: id.optional().nullable(),
      })
      .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
      }),
  });
