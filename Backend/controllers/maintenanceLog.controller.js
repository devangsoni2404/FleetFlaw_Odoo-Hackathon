import pool from "../configs/db.js";
import * as MaintenanceLog from "../models/maintenanceLog.model.js";
import * as VehicleStatusLog from "../models/vehicleStatusLog.model.js";

/* ------------------------------------------------------------------ */
/* POST /api/v1/maintenance-logs                                        */
/* Creates a maintenance log. Auto-sets vehicle to "In Shop".          */
/* ------------------------------------------------------------------ */
export const createMaintenanceLog = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verify vehicle exists
    const [vehicles] = await conn.execute(
      "SELECT vehicle_id, status, odometer_km FROM vehicles WHERE vehicle_id = ? AND is_deleted = 0",
      [req.body.vehicle_id],
    );
    if (!vehicles.length) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found." });
    }
    const vehicle = vehicles[0];

    if (vehicle.status === "Out of Service") {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Cannot create a maintenance log for an Out of Service vehicle.",
      });
    }

    // Generate unique maintenance_code
    let maintenance_code;
    for (let i = 0; i < 5; i++) {
      const code = MaintenanceLog.generateCode();
      const [dup] = await conn.execute(
        "SELECT maintenance_id FROM maintenance_logs WHERE maintenance_code = ?",
        [code],
      );
      if (!dup.length) {
        maintenance_code = code;
        break;
      }
    }
    if (!maintenance_code) {
      await conn.rollback();
      return res
        .status(500)
        .json({
          success: false,
          message: "Could not generate a unique code. Retry.",
        });
    }

    // Insert maintenance log
    const maintenance_id = await MaintenanceLog.create(
      { ...req.body, maintenance_code },
      conn,
    );

    // Set vehicle to "In Shop" (only if not already there)
    const previousStatus = vehicle.status;
    if (previousStatus !== "In Shop") {
      await VehicleStatusLog.updateVehicle(
        req.body.vehicle_id,
        "In Shop",
        conn,
      );
      await VehicleStatusLog.create(
        {
          vehicle_id: req.body.vehicle_id,
          maintenance_id,
          trip_id: null,
          previous_status: previousStatus,
          new_status: "In Shop",
          changed_reason: "Maintenance Started",
          remarks: `Maintenance log ${maintenance_code} created.`,
          odometer_at_change: req.body.odometer_at_service,
          created_by: req.body.created_by || null,
        },
        conn,
      );
    }

    await conn.commit();

    const record = await MaintenanceLog.findById(maintenance_id);
    return res.status(201).json({
      success: true,
      message: `Maintenance log created. Vehicle status set to In Shop.`,
      data: record,
    });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    next(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/maintenance-logs                                         */
/* ------------------------------------------------------------------ */
export const getMaintenanceLogs = async (req, res, next) => {
  try {
    const { vehicle_id, status, service_type, from_date, to_date } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const { rows, total } = await MaintenanceLog.findAll(
      { vehicle_id, status, service_type, from_date, to_date },
      page,
      limit,
    );

    return res.json({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/maintenance-logs/:id                                     */
/* ------------------------------------------------------------------ */
export const getMaintenanceLogById = async (req, res, next) => {
  try {
    const record = await MaintenanceLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance log not found." });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* PATCH /api/v1/maintenance-logs/:id                                   */
/* Update editable fields (no status transition here).                 */
/* ------------------------------------------------------------------ */
export const updateMaintenanceLog = async (req, res, next) => {
  try {
    const record = await MaintenanceLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance log not found." });
    }
    if (["Completed", "Cancelled"].includes(record.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a ${record.status} maintenance log.`,
      });
    }
    await MaintenanceLog.update(req.params.id, req.body);
    const updated = await MaintenanceLog.findById(req.params.id);
    return res.json({
      success: true,
      message: "Maintenance log updated.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* PATCH /api/v1/maintenance-logs/:id/status                           */
/* Status transition. Completing/Cancelling returns vehicle to         */
/* Available and logs a vehicle_status_log entry.                      */
/* ------------------------------------------------------------------ */
export const updateMaintenanceLogStatus = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const record = await MaintenanceLog.findById(req.params.id);
    if (!record) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Maintenance log not found." });
    }

    const { status, actual_completion, completion_notes, updated_by } =
      req.body;

    // Validate transition
    const allowed = {
      Scheduled: ["In Progress", "Cancelled"],
      "In Progress": ["Completed", "Cancelled"],
      Completed: [],
      Cancelled: [],
    };
    if (!allowed[record.status].includes(status)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${record.status}' to '${status}'.`,
      });
    }

    await MaintenanceLog.updateStatus(
      req.params.id,
      status,
      { actual_completion, completion_notes, updated_by },
      conn,
    );

    // On Completed or Cancelled → set vehicle back to Available
    if (status === "Completed" || status === "Cancelled") {
      const [vehicles] = await conn.execute(
        "SELECT status, odometer_km FROM vehicles WHERE vehicle_id = ? AND is_deleted = 0",
        [record.vehicle_id],
      );
      const vehicle = vehicles[0];

      if (vehicle && vehicle.status === "In Shop") {
        const changedReason =
          status === "Completed"
            ? "Maintenance Completed"
            : "Maintenance Cancelled";

        await VehicleStatusLog.updateVehicle(
          record.vehicle_id,
          "Available",
          conn,
        );
        await VehicleStatusLog.create(
          {
            vehicle_id: record.vehicle_id,
            maintenance_id: parseInt(req.params.id, 10),
            trip_id: null,
            previous_status: "In Shop",
            new_status: "Available",
            changed_reason: changedReason,
            remarks: `Maintenance log ${record.maintenance_code} ${status.toLowerCase()}.`,
            odometer_at_change: vehicle.odometer_km,
            created_by: updated_by || null,
          },
          conn,
        );
      }
    }

    await conn.commit();

    const updated = await MaintenanceLog.findById(req.params.id);
    return res.json({
      success: true,
      message: `Maintenance log status updated to '${status}'.`,
      data: updated,
    });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    next(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

/* ------------------------------------------------------------------ */
/* DELETE /api/v1/maintenance-logs/:id  (soft delete)                  */
/* ------------------------------------------------------------------ */
export const deleteMaintenanceLog = async (req, res, next) => {
  try {
    const record = await MaintenanceLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance log not found." });
    }
    await MaintenanceLog.softDelete(req.params.id, req.body.updated_by || null);
    return res.json({ success: true, message: "Maintenance log deleted." });
  } catch (err) {
    next(err);
  }
};
