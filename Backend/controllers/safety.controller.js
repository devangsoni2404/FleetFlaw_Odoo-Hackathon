import {
  DRIVER_STATUSES,
  getAllDrivers,
  getDriverById,
  getExpiredDrivers,
  updateDriverSafetyScore,
  updateDriverStatus,
} from '../models/driver.model.js';

const parseId = (value) => Number.parseInt(value, 10);

export const listSafetyDrivers = async (req, res) => {
  try {
    const drivers = await getAllDrivers({ includeDeleted: false });
    return res.status(200).json({ success: true, data: drivers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const listExpiredLicenseDrivers = async (req, res) => {
  try {
    const drivers = await getExpiredDrivers();
    return res.status(200).json({ success: true, data: drivers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSafetyDriverStatus = async (req, res) => {
  try {
    const driverId = parseId(req.params.id);
    if (Number.isNaN(driverId)) {
      return res.status(400).json({ success: false, message: 'Invalid driver id' });
    }

    const { status, updated_by } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    if (!DRIVER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${DRIVER_STATUSES.join(', ')}`,
      });
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;
    const driver = await updateDriverStatus({ driverId, status, actorId });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found or deleted' });
    }

    return res.status(200).json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSafetyDriverScore = async (req, res) => {
  try {
    const driverId = parseId(req.params.id);
    if (Number.isNaN(driverId)) {
      return res.status(400).json({ success: false, message: 'Invalid driver id' });
    }

    const { safety_score, updated_by } = req.body;
    const score = Number.parseFloat(safety_score);

    if (Number.isNaN(score)) {
      return res.status(400).json({ success: false, message: 'safety_score is required and must be a number' });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: 'safety_score must be between 0 and 100' });
    }

    const existingDriver = await getDriverById(driverId, false);
    if (!existingDriver) {
      return res.status(404).json({ success: false, message: 'Driver not found or deleted' });
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;
    const driver = await updateDriverSafetyScore({ driverId, safetyScore: score, actorId });

    return res.status(200).json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSafetyDashboard = async (req, res) => {
  try {
    const drivers = await getAllDrivers({ includeDeleted: false });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiredLicenseCount = drivers.filter((driver) => {
      if (!driver.license_expiry_date) {
        return false;
      }
      return new Date(driver.license_expiry_date) < now;
    }).length;

    const suspendedCount = drivers.filter((driver) => driver.status === 'Suspended').length;
    const offDutyCount = drivers.filter((driver) => driver.status === 'Off Duty').length;

    const scoreList = drivers
      .map((driver) => Number.parseFloat(driver.safety_score))
      .filter((score) => !Number.isNaN(score));

    const averageSafetyScore = scoreList.length
      ? Number((scoreList.reduce((sum, score) => sum + score, 0) / scoreList.length).toFixed(2))
      : 0;

    const lowScoreDrivers = drivers
      .filter((driver) => Number.parseFloat(driver.safety_score) < 70)
      .sort((a, b) => Number.parseFloat(a.safety_score) - Number.parseFloat(b.safety_score))
      .slice(0, 10)
      .map((driver) => ({
        driver_id: driver.driver_id,
        full_name: driver.full_name,
        safety_score: driver.safety_score,
        status: driver.status,
      }));

    return res.status(200).json({
      success: true,
      data: {
        total_drivers: drivers.length,
        expired_license_count: expiredLicenseCount,
        suspended_count: suspendedCount,
        off_duty_count: offDutyCount,
        average_safety_score: averageSafetyScore,
        low_score_drivers: lowScoreDrivers,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
