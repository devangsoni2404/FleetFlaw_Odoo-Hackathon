import {
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  createVehicle,
  getAllVehicles,
  getVehicleById,
  getVehicleByLicensePlate,
  softDeleteVehicle,
  updateVehicle,
  updateVehicleStatus,
} from '../models/vehicle.model.js';

const parseId = (value) => Number.parseInt(value, 10);

export const listVehicles = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const vehicles = await getAllVehicles({ includeDeleted });
    return res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicle = async (req, res) => {
  try {
    const vehicleId = parseId(req.params.id);
    if (Number.isNaN(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const vehicle = await getVehicleById(vehicleId, includeDeleted);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    return res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addVehicle = async (req, res) => {
  try {
    const {
      license_plate,
      make,
      model,
      year,
      type,
      max_load_kg,
      fuel_tank_liters,
      odometer_km,
      acquisition_cost,
      status,
      created_by,
    } = req.body;

    if (!license_plate || !make || !model || !year || !type || !max_load_kg || !fuel_tank_liters || !acquisition_cost) {
      return res.status(400).json({
        success: false,
        message: 'license_plate, make, model, year, type, max_load_kg, fuel_tank_liters, acquisition_cost are required',
      });
    }

    if (!VEHICLE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed: ${VEHICLE_TYPES.join(', ')}`,
      });
    }

    if (status !== undefined && !VEHICLE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VEHICLE_STATUSES.join(', ')}`,
      });
    }

    const existing = await getVehicleByLicensePlate(license_plate);
    if (existing) {
      return res.status(409).json({ success: false, message: 'License plate already exists' });
    }

    const actorId = req.user?.user_id ?? created_by ?? null;

    const vehicle = await createVehicle({
      licensePlate: license_plate,
      make,
      model,
      year,
      type,
      maxLoadKg: max_load_kg,
      fuelTankLiters: fuel_tank_liters,
      odometerKm: odometer_km,
      acquisitionCost: acquisition_cost,
      status,
      actorId,
    });

    return res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editVehicle = async (req, res) => {
  try {
    const vehicleId = parseId(req.params.id);
    if (Number.isNaN(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle id' });
    }

    const {
      license_plate,
      make,
      model,
      year,
      type,
      max_load_kg,
      fuel_tank_liters,
      odometer_km,
      acquisition_cost,
      status,
      updated_by,
    } = req.body;

    if (
      license_plate === undefined &&
      make === undefined &&
      model === undefined &&
      year === undefined &&
      type === undefined &&
      max_load_kg === undefined &&
      fuel_tank_liters === undefined &&
      odometer_km === undefined &&
      acquisition_cost === undefined &&
      status === undefined
    ) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    if (type !== undefined && !VEHICLE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed: ${VEHICLE_TYPES.join(', ')}`,
      });
    }

    if (status !== undefined && !VEHICLE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VEHICLE_STATUSES.join(', ')}`,
      });
    }

    if (license_plate !== undefined) {
      const existing = await getVehicleByLicensePlate(license_plate);
      if (existing && existing.vehicle_id !== vehicleId) {
        return res.status(409).json({ success: false, message: 'License plate already exists' });
      }
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;

    const vehicle = await updateVehicle({
      vehicleId,
      licensePlate: license_plate,
      make,
      model,
      year,
      type,
      maxLoadKg: max_load_kg,
      fuelTankLiters: fuel_tank_liters,
      odometerKm: odometer_km,
      acquisitionCost: acquisition_cost,
      status,
      actorId,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or deleted' });
    }

    return res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changeVehicleStatus = async (req, res) => {
  try {
    const vehicleId = parseId(req.params.id);
    if (Number.isNaN(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle id' });
    }

    const { status, updated_by } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    if (!VEHICLE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VEHICLE_STATUSES.join(', ')}`,
      });
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;
    const vehicle = await updateVehicleStatus({ vehicleId, status, actorId });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or deleted' });
    }

    return res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicleId = parseId(req.params.id);
    if (Number.isNaN(vehicleId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteVehicle({ vehicleId, actorId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
