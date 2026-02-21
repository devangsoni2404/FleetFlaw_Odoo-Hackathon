import {
  createShipment,
  getAllShipments,
  getShipmentById,
  updateShipment,
  softDeleteShipment,
  restoreShipment,
} from '../models/shipment.model.js';

const parseId = (value) => Number.parseInt(value, 10);

export const listShipments = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const shipments = await getAllShipments({ includeDeleted });
    return res.status(200).json({ success: true, data: shipments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getShipment = async (req, res) => {
  try {
    const shipmentId = parseId(req.params.shipmentId);
    if (Number.isNaN(shipmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid shipment_id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const shipment = await getShipmentById(shipmentId, includeDeleted);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    return res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addShipment = async (req, res) => {
  try {
    const payload = req.body;
    const actorId = req.user?.user_id ?? payload.created_by ?? null;
    const shipment = await createShipment({ payload, actorId });
    return res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editShipment = async (req, res) => {
  try {
    const shipmentId = parseId(req.params.shipmentId);
    if (Number.isNaN(shipmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid shipment_id' });
    }

    const payload = req.body;
    const actorId = req.user?.user_id ?? payload.updated_by ?? null;
    const shipment = await updateShipment({ shipmentId, payload, actorId });

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found or deleted' });
    return res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteShipment = async (req, res) => {
  try {
    const shipmentId = parseId(req.params.shipmentId);
    if (Number.isNaN(shipmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid shipment_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteShipment({ shipmentId, actorId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Shipment not found or already deleted' });

    return res.status(200).json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const undeleteShipment = async (req, res) => {
  try {
    const shipmentId = parseId(req.params.shipmentId);
    if (Number.isNaN(shipmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid shipment_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const shipment = await restoreShipment({ shipmentId, actorId });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found or not deleted' });

    return res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
