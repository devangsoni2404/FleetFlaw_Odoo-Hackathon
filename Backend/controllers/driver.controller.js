import {
  DRIVER_STATUSES,
  LICENSE_TYPES,
  createDriver,
  getAllDrivers,
  getDriverByEmail,
  getDriverById,
  getDriverByLicense,
  getDriverByPhone,
  softDeleteDriver,
  updateDriver,
  updateDriverStatus,
} from '../models/driver.model.js';

const parseId = (value) => Number.parseInt(value, 10);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const listDrivers = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const drivers = await getAllDrivers({ includeDeleted });
    return res.status(200).json({ success: true, data: drivers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDriver = async (req, res) => {
  try {
    const driverId = parseId(req.params.id);
    if (Number.isNaN(driverId)) {
      return res.status(400).json({ success: false, message: 'Invalid driver id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const driver = await getDriverById(driverId, includeDeleted);

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    return res.status(200).json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addDriver = async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      phone,
      email,
      profile_photo_url,
      license_number,
      license_type,
      license_expiry_date,
      is_license_valid,
      status,
      created_by,
    } = req.body;

    if (!full_name || !phone || !license_number || !license_type || !license_expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'full_name, phone, license_number, license_type, license_expiry_date are required',
      });
    }

    if (!LICENSE_TYPES.includes(license_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid license_type. Allowed: ${LICENSE_TYPES.join(', ')}`,
      });
    }

    if (status !== undefined && !DRIVER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${DRIVER_STATUSES.join(', ')}`,
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const existingPhone = await getDriverByPhone(phone);
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone already exists' });
    }

    const existingLicense = await getDriverByLicense(license_number);
    if (existingLicense) {
      return res.status(409).json({ success: false, message: 'License number already exists' });
    }

    if (email) {
      const existingEmail = await getDriverByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
    }

    const actorId = req.user?.user_id ?? created_by ?? null;

    const driver = await createDriver({
      userId: user_id,
      fullName: full_name,
      phone,
      email,
      profilePhotoUrl: profile_photo_url,
      licenseNumber: license_number,
      licenseType: license_type,
      licenseExpiryDate: license_expiry_date,
      isLicenseValid: is_license_valid,
      status,
      actorId,
    });

    return res.status(201).json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editDriver = async (req, res) => {
  try {
    const driverId = parseId(req.params.id);
    if (Number.isNaN(driverId)) {
      return res.status(400).json({ success: false, message: 'Invalid driver id' });
    }

    const {
      user_id,
      full_name,
      phone,
      email,
      profile_photo_url,
      license_number,
      license_type,
      license_expiry_date,
      is_license_valid,
      status,
      updated_by,
    } = req.body;

    if (
      user_id === undefined &&
      full_name === undefined &&
      phone === undefined &&
      email === undefined &&
      profile_photo_url === undefined &&
      license_number === undefined &&
      license_type === undefined &&
      license_expiry_date === undefined &&
      is_license_valid === undefined &&
      status === undefined
    ) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    if (license_type !== undefined && !LICENSE_TYPES.includes(license_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid license_type. Allowed: ${LICENSE_TYPES.join(', ')}`,
      });
    }

    if (status !== undefined && !DRIVER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${DRIVER_STATUSES.join(', ')}`,
      });
    }

    if (email !== undefined && email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (phone !== undefined) {
      const existingPhone = await getDriverByPhone(phone);
      if (existingPhone && existingPhone.driver_id !== driverId) {
        return res.status(409).json({ success: false, message: 'Phone already exists' });
      }
    }

    if (license_number !== undefined) {
      const existingLicense = await getDriverByLicense(license_number);
      if (existingLicense && existingLicense.driver_id !== driverId) {
        return res.status(409).json({ success: false, message: 'License number already exists' });
      }
    }

    if (email !== undefined && email) {
      const existingEmail = await getDriverByEmail(email);
      if (existingEmail && existingEmail.driver_id !== driverId) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;

    const driver = await updateDriver({
      driverId,
      userId: user_id,
      fullName: full_name,
      phone,
      email,
      profilePhotoUrl: profile_photo_url,
      licenseNumber: license_number,
      licenseType: license_type,
      licenseExpiryDate: license_expiry_date,
      isLicenseValid: is_license_valid,
      status,
      actorId,
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found or deleted' });
    }

    return res.status(200).json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changeDriverStatus = async (req, res) => {
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

export const deleteDriver = async (req, res) => {
  try {
    const driverId = parseId(req.params.id);
    if (Number.isNaN(driverId)) {
      return res.status(400).json({ success: false, message: 'Invalid driver id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteDriver({ driverId, actorId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Driver not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
