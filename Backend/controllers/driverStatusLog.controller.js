import pool from "../configs/db.js";
import * as DriverStatusLog from "../models/driverStatusLog.model.js";

/* ------------------------------------------------------------------ */
/* POST /api/v1/driver-status-logs                                      */
/* Creates a log entry and updates the driver's current status.        */
/* Optionally updates the driver's safety_score.                       */
/* ------------------------------------------------------------------ */
export const createDriverStatusLog = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const { driver_id, previous_status, new_status, safety_score_after } =
      req.body;

    // Verify driver exists
    const [drivers] = await conn.execute(
      "SELECT driver_id, status, safety_score FROM drivers WHERE driver_id = ? AND is_deleted = 0",
      [driver_id],
    );
    if (!drivers.length) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Driver not found." });
    }
    const driver = drivers[0];

    // Validate that previous_status matches the driver's actual current status
    if (driver.status !== previous_status) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Conflict: driver's current status is '${driver.status}', but previous_status supplied is '${previous_status}'.`,
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

    // Insert log
    const log_id = await DriverStatusLog.create(
      {
        ...req.body,
        safety_score_before:
          req.body.safety_score_before ?? driver.safety_score,
      },
      conn,
    );

    // Update driver status (and safety_score if provided)
    await DriverStatusLog.updateDriver(
      driver_id,
      new_status,
      safety_score_after,
      conn,
    );

    await conn.commit();

    const record = await DriverStatusLog.findById(log_id);
    return res.status(201).json({
      success: true,
      message: `Driver status updated from '${previous_status}' to '${new_status}'.`,
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
/* GET /api/v1/driver-status-logs                                       */
/* ------------------------------------------------------------------ */
export const getDriverStatusLogs = async (req, res, next) => {
  try {
    const {
      driver_id,
      trip_id,
      changed_reason,
      incident_type,
      from_date,
      to_date,
    } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const { rows, total } = await DriverStatusLog.findAll(
      { driver_id, trip_id, changed_reason, incident_type, from_date, to_date },
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
/* GET /api/v1/driver-status-logs/:id                                   */
/* ------------------------------------------------------------------ */
export const getDriverStatusLogById = async (req, res, next) => {
  try {
    const record = await DriverStatusLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Driver status log not found." });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/driver-status-logs/driver/:driver_id                    */
/* Full status history for one driver.                                  */
/* ------------------------------------------------------------------ */
export const getDriverHistory = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    // Verify driver exists
    const currentStatus = await DriverStatusLog.getDriverCurrentStatus(
      req.params.driver_id,
    );
    if (currentStatus === null) {
      return res
        .status(404)
        .json({ success: false, message: "Driver not found." });
    }

    const { rows, total } = await DriverStatusLog.findByDriverId(
      req.params.driver_id,
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
/* DELETE /api/v1/driver-status-logs/:id  (soft delete)                */
/* Audit records are immutable; soft delete only removes them from     */
/* standard queries. The driver's live status is NOT reverted.         */
/* ------------------------------------------------------------------ */
export const deleteDriverStatusLog = async (req, res, next) => {
  try {
    const record = await DriverStatusLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Driver status log not found." });
    }
    await DriverStatusLog.softDelete(
      req.params.id,
      req.body.updated_by || null,
    );
    return res.json({ success: true, message: "Driver status log deleted." });
  } catch (err) {
    next(err);
  }
};
