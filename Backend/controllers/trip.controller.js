import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  softDeleteTrip,
} from '../models/trip.model.js';
import { getVehicleById, updateVehicleStatus, logVehicleStatus } from '../models/vehicle.model.js';
import { getDriverById, updateDriverStatus, logDriverStatus, incrementDriverTrips } from '../models/driver.model.js';
import { getShipmentById, updateShipmentStatus } from '../models/shipment.model.js';

const parseTripId = (value) => Number.parseInt(value, 10);

export const dispatchTrip = async (req, res) => {
  try {
    const tripId = parseTripId(req.params.tripId);
    if (Number.isNaN(tripId)) {
      return res.status(400).json({ success: false, message: 'Invalid trip_id' });
    }

    const trip = await getTripById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or deleted' });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({ 
        success: false, 
        message: `Only trips in 'Draft' status can be dispatched. Current status: ${trip.status}` 
      });
    }

    const { vehicle_id, driver_id } = trip;
    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const changedReason = 'Trip Dispatched';

    // Execute Step 3 Updates
    // 1. Update Trip Status -> Dispatched
    const tripUpdate = await updateTrip(tripId, { status: 'Dispatched', updated_by: actorId });
    if (!tripUpdate) throw new Error('Failed to update trip status');

    // 2. Update Vehicle Status -> On Trip + Log
    await updateVehicleStatus({ vehicleId: vehicle_id, status: 'On Trip', actorId });
    await logVehicleStatus({ vehicleId: vehicle_id, status: 'On Trip', changedReason, actorId });

    // 3. Update Driver Status -> On Trip + Log + Increment Triple
    await updateDriverStatus({ driverId: driver_id, status: 'On Trip', actorId });
    await logDriverStatus({ driverId: driver_id, status: 'On Trip', changedReason, actorId });
    await incrementDriverTrips(driver_id);

    return res.status(200).json({ 
      success: true, 
      message: 'Trip dispatched successfully, related records updated.',
      data: tripUpdate
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const listTrips = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const trips = await getAllTrips({ includeDeleted });
    return res.status(200).json({ success: true, data: trips });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrip = async (req, res) => {
  try {
    const tripId = parseTripId(req.params.tripId);
    if (Number.isNaN(tripId)) {
      return res.status(400).json({ success: false, message: 'Invalid trip_id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const trip = await getTripById(tripId, includeDeleted);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addTrip = async (req, res) => {
  try {
    const tripData = { ...req.body };
    const { vehicle_id, driver_id, shipment_id } = tripData;
    
    // Basic validation
    if (!vehicle_id || !driver_id || !shipment_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'vehicle_id, driver_id, and shipment_id are required' 
      });
    }

    // 1. Fetch related data for validation
    const [vehicle, driver, shipment] = await Promise.all([
      getVehicleById(vehicle_id),
      getDriverById(driver_id),
      getShipmentById(shipment_id),
    ]);

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    // 2. Weight Check
    const weightToVerify = tripData.cargo_weight_kg ?? shipment.cargo_weight_kg;
    if (weightToVerify > vehicle.max_load_kg) {
      return res.status(400).json({ 
        success: false, 
        message: `Weight Check Failed: Cargo weight (${weightToVerify}kg) exceeds vehicle capacity (${vehicle.max_load_kg}kg)` 
      });
    }

    // 3. Vehicle Available
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ 
        success: false, 
        message: `Vehicle Available Check Failed: Vehicle is currently ${vehicle.status}` 
      });
    }

    // 4. Driver Valid
    const isDriverAvailable = driver.status === 'Available';
    const isLicenseValid = Boolean(driver.is_license_valid);
    const isLicenseTypeMatch = driver.license_type === vehicle.type;

    if (!isDriverAvailable || !isLicenseValid || !isLicenseTypeMatch) {
      let driverError = 'Driver Valid Check Failed: ';
      if (!isDriverAvailable) driverError += `Driver is ${driver.status}. `;
      if (!isLicenseValid) driverError += 'Driver license is invalid. ';
      if (!isLicenseTypeMatch) driverError += `License type mismatch (${driver.license_type} vs ${vehicle.type}).`;
      
      return res.status(400).json({ success: false, message: driverError.trim() });
    }

    // --- Step 2: On Trip Creation (Draft) ---
    const actorId = req.user?.user_id ?? tripData.created_by ?? null;
    
    // Set status to Draft
    tripData.status = 'Draft';
    
    // Snapshot cargo_weight_kg from shipment if not provided
    if (!tripData.cargo_weight_kg) {
      tripData.cargo_weight_kg = shipment.cargo_weight_kg;
    }
    
    // Capture odometer_start_km from vehicle
    tripData.odometer_start_km = vehicle.odometer_km;
    
    // Create the trip
    const trip = await createTrip({ ...tripData, created_by: actorId, updated_by: actorId });

    if (trip) {
      // Update shipment status to Assigned
      await updateShipmentStatus({ 
        shipmentId: shipment_id, 
        status: 'Assigned', 
        actorId 
      });
    }

    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editTrip = async (req, res) => {
  try {
    const tripId = parseTripId(req.params.tripId);
    if (Number.isNaN(tripId)) {
      return res.status(400).json({ success: false, message: 'Invalid trip_id' });
    }

    const tripData = req.body;
    const actorId = req.user?.user_id ?? tripData.updated_by ?? null;
    
    const trip = await updateTrip(tripId, { ...tripData, updated_by: actorId });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or deleted' });
    }

    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const tripId = parseTripId(req.params.tripId);
    if (Number.isNaN(tripId)) {
      return res.status(400).json({ success: false, message: 'Invalid trip_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteTrip(tripId, actorId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Trip not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
