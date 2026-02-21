import { z } from "zod";

const id = z.coerce.number().int().positive();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

const serviceType = z.enum([
  "Oil Change",
  "Tyre Replacement",
  "Brake Service",
  "Engine Repair",
  "Body Work",
  "Electrical",
  "AC Service",
  "General Inspection",
  "Other",
]);

const statusEnum = z.enum(["Scheduled", "In Progress", "Completed", "Cancelled"]);

export const listSchema = z.object({
  query: z.object({
    vehicle_id: id.optional(),
    status: statusEnum.optional(),
    service_type: serviceType.optional(),
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
    service_type: serviceType,
    service_description: z.string().max(5000).optional(),
    service_provider: z.string().max(150).optional(),
    service_provider_phone: z.string().max(20).optional(),
    service_date: dateString,
    expected_completion: dateString,
    actual_completion: dateString.optional().nullable(),
    labour_cost: z.coerce.number().min(0).optional(),
    parts_cost: z.coerce.number().min(0).optional(),
    odometer_at_service: z.coerce.number().min(0),
    status: statusEnum.optional(),
    completion_notes: z.string().max(5000).optional(),
    next_service_due_km: z.coerce.number().min(0).optional().nullable(),
    next_service_due_date: dateString.optional().nullable(),
    created_by: id.optional().nullable(),
    updated_by: id.optional().nullable(),
  }),
});

export const updateSchema = z
  .object({
    params: z.object({ id }),
    body: z
      .object({
        service_type: serviceType.optional(),
        service_description: z.string().max(5000).optional().nullable(),
        service_provider: z.string().max(150).optional().nullable(),
        service_provider_phone: z.string().max(20).optional().nullable(),
        service_date: dateString.optional(),
        expected_completion: dateString.optional(),
        actual_completion: dateString.optional().nullable(),
        labour_cost: z.coerce.number().min(0).optional(),
        parts_cost: z.coerce.number().min(0).optional(),
        odometer_at_service: z.coerce.number().min(0).optional(),
        completion_notes: z.string().max(5000).optional().nullable(),
        next_service_due_km: z.coerce.number().min(0).optional().nullable(),
        next_service_due_date: dateString.optional().nullable(),
        updated_by: id.optional().nullable(),
      })
      .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
      }),
  });

export const updateStatusSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    status: statusEnum,
    actual_completion: dateString.optional().nullable(),
    completion_notes: z.string().max(5000).optional().nullable(),
    updated_by: id.optional().nullable(),
  }),
});
