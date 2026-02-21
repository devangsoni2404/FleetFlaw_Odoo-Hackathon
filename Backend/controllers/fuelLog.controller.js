import pool from "../configs/db.js";
import * as FuelLog from "../models/fuelLog.model.js";

/* ------------------------------------------------------------------ */
/* POST /api/v1/fuel-logs                                               */
/* Creates a fuel log and recalculates the trip's total_fuel_cost.     */
/* ------------------------------------------------------------------ */
export const createFuelLog = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verify FK references exist
    const [vehicles] = await conn.execute(
      "SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND is_deleted = 0",
      [req.body.vehicle_id],
    );
    if (!vehicles.length) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found." });
    }

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

    const [drivers] = await conn.execute(
      "SELECT driver_id FROM drivers WHERE driver_id = ? AND is_deleted = 0",
      [req.body.driver_id],
    );
    if (!drivers.length) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Driver not found." });
    }

    // Generate unique fuel_log_code
    let fuel_log_code;
    for (let i = 0; i < 5; i++) {
      const code = FuelLog.generateCode();
      const [dup] = await conn.execute(
        "SELECT fuel_log_id FROM fuel_logs WHERE fuel_log_code = ?",
        [code],
      );
      if (!dup.length) {
        fuel_log_code = code;
        break;
      }
    }
    if (!fuel_log_code) {
      await conn.rollback();
      return res
        .status(500)
        .json({
          success: false,
          message: "Could not generate a unique code. Retry.",
        });
    }

    const fuel_log_id = await FuelLog.create(
      { ...req.body, fuel_log_code },
      conn,
    );

    // Recalculate trip total_fuel_cost
    await FuelLog.recalcTripFuelCost(req.body.trip_id, conn);

    await conn.commit();

    const record = await FuelLog.findById(fuel_log_id);
    return res.status(201).json({
      success: true,
      message: "Fuel log created. Trip fuel cost updated.",
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
/* GET /api/v1/fuel-logs                                                */
/* ------------------------------------------------------------------ */
export const getFuelLogs = async (req, res, next) => {
  try {
    const { vehicle_id, trip_id, driver_id, fuel_type, from_date, to_date } =
      req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const { rows, total } = await FuelLog.findAll(
      { vehicle_id, trip_id, driver_id, fuel_type, from_date, to_date },
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
/* GET /api/v1/fuel-logs/:id                                            */
/* ------------------------------------------------------------------ */
export const getFuelLogById = async (req, res, next) => {
  try {
    const record = await FuelLog.findById(req.params.id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Fuel log not found." });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* PATCH /api/v1/fuel-logs/:id                                          */
/* ------------------------------------------------------------------ */
export const updateFuelLog = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const record = await FuelLog.findById(req.params.id);
    if (!record) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Fuel log not found." });
    }

    await FuelLog.update(req.params.id, req.body, conn);

    // Recalculate trip fuel cost if pricing fields changed
    const pricingChanged =
      req.body.liters_filled !== undefined ||
      req.body.price_per_liter !== undefined;
    if (pricingChanged) {
      await FuelLog.recalcTripFuelCost(record.trip_id, conn);
    }

    await conn.commit();

    const updated = await FuelLog.findById(req.params.id);
    return res.json({
      success: true,
      message: "Fuel log updated.",
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
/* DELETE /api/v1/fuel-logs/:id  (soft delete)                         */
/* ------------------------------------------------------------------ */
export const deleteFuelLog = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const record = await FuelLog.findById(req.params.id);
    if (!record) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Fuel log not found." });
    }

    await FuelLog.softDelete(req.params.id, req.body.updated_by || null, conn);

    // Recalculate trip fuel cost after removal
    await FuelLog.recalcTripFuelCost(record.trip_id, conn);

    await conn.commit();
    return res.json({
      success: true,
      message: "Fuel log deleted. Trip fuel cost updated.",
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
