import { z } from "zod";

const id = z.coerce.number().int().positive();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");
const dateTimeString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Use a valid datetime string",
});

const statusEnum = z.enum(["Available", "On Trip", "In Shop", "Out of Service"]);
const changedReasonEnum = z.enum([
  "Trip Dispatched",
  "Trip Completed",
  "Trip Cancelled",
  "Maintenance Started",
  "Maintenance Completed",
  "Maintenance Cancelled",
  "Manually Retired",
  "Manually Reinstated",
  "Other",
]);

export const listSchema = z.object({
  query: z.object({
    vehicle_id: id.optional(),
    trip_id: id.optional(),
    maintenance_id: id.optional(),
    changed_reason: changedReasonEnum.optional(),
    from_date: dateString.optional(),
    to_date: dateString.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id }),
});

export const vehicleIdParamSchema = z.object({
  params: z.object({ vehicle_id: id }),
  query: z.object({
    from_date: dateString.optional(),
    to_date: dateString.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

export const createSchema = z.object({
  body: z.object({
    vehicle_id: id,
    trip_id: id.optional().nullable(),
    maintenance_id: id.optional().nullable(),
    previous_status: statusEnum,
    new_status: statusEnum,
    changed_reason: changedReasonEnum,
    remarks: z.string().max(255).optional(),
    odometer_at_change: z.coerce.number().min(0),
    changed_at: dateTimeString.optional(),
    created_by: id.optional().nullable(),
    updated_by: id.optional().nullable(),
  }),
});
