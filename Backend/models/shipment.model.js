import db from '../configs/db.js';

const normalizeShipment = (row) => ({
  shipment_id: row.shipment_id,
  shipment_code: row.shipment_code,
  description: row.description,
  cargo_weight_kg: Number(row.cargo_weight_kg),
  cargo_volume_m3: Number(row.cargo_volume_m3),
  cargo_type: row.cargo_type,
  origin_address: row.origin_address,
  destination_address: row.destination_address,
  origin_lat: row.origin_lat,
  origin_lng: row.origin_lng,
  destination_lat: row.destination_lat,
  destination_lng: row.destination_lng,
  sender_name: row.sender_name,
  sender_phone: row.sender_phone,
  receiver_name: row.receiver_name,
  receiver_phone: row.receiver_phone,
  declared_value: Number(row.declared_value),
  delivery_charge: Number(row.delivery_charge),
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

export const createShipment = async ({ payload, actorId }) => {
  const [result] = await db.execute(
    `INSERT INTO shipments (
       shipment_code, description, cargo_weight_kg, cargo_volume_m3,
       cargo_type, origin_address, destination_address,
       origin_lat, origin_lng, destination_lat, destination_lng,
       sender_name, sender_phone, receiver_name, receiver_phone,
       declared_value, delivery_charge, status, created_by, updated_by
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.shipment_code ?? null,
      payload.description ?? null,
      payload.cargo_weight_kg ?? null,
      payload.cargo_volume_m3 ?? null,
      payload.cargo_type ?? null,
      payload.origin_address ?? null,
      payload.destination_address ?? null,
      payload.origin_lat ?? null,
      payload.origin_lng ?? null,
      payload.destination_lat ?? null,
      payload.destination_lng ?? null,
      payload.sender_name ?? null,
      payload.sender_phone ?? null,
      payload.receiver_name ?? null,
      payload.receiver_phone ?? null,
      payload.declared_value ?? null,
      payload.delivery_charge ?? null,
      payload.status ?? 'Pending',
      actorId ?? null,
      actorId ?? null,
    ]
  );

  return getShipmentById(result.insertId, true);
};

export const getAllShipments = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `SELECT * FROM shipments WHERE (? = 1 OR is_deleted = 0) ORDER BY shipment_id ASC`,
    [includeDeleted ? 1 : 0]
  );

  return rows.map(normalizeShipment);
};

export const getShipmentById = async (shipmentId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `SELECT * FROM shipments WHERE shipment_id = ? AND (? = 1 OR is_deleted = 0) LIMIT 1`,
    [shipmentId, includeDeleted ? 1 : 0]
  );

  return rows.length ? normalizeShipment(rows[0]) : null;
};

export const updateShipment = async ({ shipmentId, payload, actorId }) => {
  const [result] = await db.execute(
    `UPDATE shipments SET
       shipment_code = ?, description = ?, cargo_weight_kg = ?, cargo_volume_m3 = ?,
       cargo_type = ?, origin_address = ?, destination_address = ?,
       origin_lat = ?, origin_lng = ?, destination_lat = ?, destination_lng = ?,
       sender_name = ?, sender_phone = ?, receiver_name = ?, receiver_phone = ?,
       declared_value = ?, delivery_charge = ?, status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE shipment_id = ? AND is_deleted = 0`,
    [
      payload.shipment_code ?? null,
      payload.description ?? null,
      payload.cargo_weight_kg ?? null,
      payload.cargo_volume_m3 ?? null,
      payload.cargo_type ?? null,
      payload.origin_address ?? null,
      payload.destination_address ?? null,
      payload.origin_lat ?? null,
      payload.origin_lng ?? null,
      payload.destination_lat ?? null,
      payload.destination_lng ?? null,
      payload.sender_name ?? null,
      payload.sender_phone ?? null,
      payload.receiver_name ?? null,
      payload.receiver_phone ?? null,
      payload.declared_value ?? null,
      payload.delivery_charge ?? null,
      payload.status ?? null,
      actorId ?? null,
      shipmentId,
    ]
  );

  if (!result.affectedRows) return null;
  return getShipmentById(shipmentId, true);
};

export const softDeleteShipment = async ({ shipmentId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE shipments SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE shipment_id = ? AND is_deleted = 0`,
    [actorId ?? null, shipmentId]
  );

  return result.affectedRows > 0;
};

export const restoreShipment = async ({ shipmentId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE shipments SET is_deleted = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE shipment_id = ? AND is_deleted = 1`,
    [actorId ?? null, shipmentId]
  );

  if (!result.affectedRows) return null;
  return getShipmentById(shipmentId, true);
};

export const updateShipmentStatus = async ({ shipmentId, status, actorId }) => {
  const [result] = await db.execute(
    `UPDATE shipments SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE shipment_id = ? AND is_deleted = 0`,
    [status, actorId ?? null, shipmentId]
  );
  return result.affectedRows > 0;
};
