import pool from "../configs/db.js";
import * as VehicleStatusLog from "../models/vehicleStatusLog.model.js";

/* ------------------------------------------------------------------ */
/* POST /api/v1/vehicle-status-logs                                     */
/* Creates a log entry and updates the vehicle's current status.       */
/* ------------------------------------------------------------------ */
export const createVehicleStatusLog = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const { vehicle_id, previous_status, new_status } = req.body;

    // Verify vehicle exists
    const vehicleCurrent = await VehicleStatusLog.getVehicleCurrent(vehicle_id);
    if (!vehicleCurrent) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found." });
    }

    // Validate that previous_status matches the vehicle's actual current status
    if (vehicleCurrent.status !== previous_status) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Conflict: vehicle's current status is '${vehicleCurrent.status}', but previous_status supplied is '${previous_status}'.`,
      });
    }

    // Verify trip_id if provided
    if (req.body.trip_id) {
      const [trips] = await conn.execute(
        "SELECT trip_id FROM trips WHERE trip_id = ? AND is_deleted = 0",
        [req.body.trip_id],
      );
      if (!trips.length) {
        await conn.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Trip not found." });
      }
    }

    // Verify maintenance_id if provided
    if (req.body.maintenance_id) {
      const [maint] = await conn.execute(
        "SELECT maintenance_id FROM maintenance_logs WHERE maintenance_id = ? AND is_deleted = 0",
        [req.body.maintenance_id],
      );
      if (!maint.length) {
        await conn.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Maintenance log not found." });
      }
    }

    // Insert log
    const log_id = await VehicleStatusLog.create(req.body, conn);

    // Update vehicle status
    await VehicleStatusLog.updateVehicle(vehicle_id, new_status, conn);

    await conn.commit();

    const record = await VehicleStatusLog.findById(log_id);
    return res.status(201).json({
      success: true,
      message: `Vehicle status updated from '${previous_status}' to '${new_status}'.`,
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
/* GET /api/v1/vehicle-status-logs                                      */
/* ------------------------------------------------------------------ */
export const getVehicleStatusLogs = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      trip_id,
      maintenance_id,
      changed_reason,
      from_date,
      to_date,
    } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const { rows, total } = await VehicleStatusLog.findAll(
      {
        vehicle_id,
        trip_id,
        maintenance_id,
        changed_reason,
        from_date,
        to_date,
      },
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
/* GET /api/v1/vehicle-status-logs/:id                                  */
/* ------------------------------------------------------------------ */
export const getVehicleStatusLogById = async (req, res, next) => {
  try {
    const record = await VehicleStatusLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle status log not found." });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/vehicle-status-logs/vehicle/:vehicle_id                 */
/* Full status history for one vehicle.                                 */
/* ------------------------------------------------------------------ */
export const getVehicleHistory = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    // Verify vehicle exists
    const vehicleCurrent = await VehicleStatusLog.getVehicleCurrent(
      req.params.vehicle_id,
    );
    if (!vehicleCurrent) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found." });
    }

    const { rows, total } = await VehicleStatusLog.findByVehicleId(
      req.params.vehicle_id,
      { from_date, to_date },
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
/* DELETE /api/v1/vehicle-status-logs/:id  (soft delete)               */
/* Audit records are immutable; soft delete only removes them from     */
/* standard queries. The vehicle's live status is NOT reverted.        */
/* ------------------------------------------------------------------ */
export const deleteVehicleStatusLog = async (req, res, next) => {
  try {
    const record = await VehicleStatusLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle status log not found." });
    }
    await VehicleStatusLog.softDelete(
      req.params.id,
      req.body.updated_by || null,
    );
    return res.json({ success: true, message: "Vehicle status log deleted." });
  } catch (err) {
    next(err);
  }
};
