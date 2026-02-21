import db from '../configs/db.js';

export const ROLE_NAMES = ['Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

const normalizeRole = (row) => ({
  role_id: row.role_id,
  name: row.name,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

export const findActiveRoleByName = async (name) => {
  const [rows] = await db.execute(
    `SELECT role_id, name, created_at, updated_at, created_by, updated_by, is_deleted
     FROM roles
     WHERE name = ? AND is_deleted = 0
     LIMIT 1`,
    [name]
  );

  return rows.length ? normalizeRole(rows[0]) : null;
};

export const createRole = async ({ name, actorId }) => {
  const [result] = await db.execute(
    `INSERT INTO roles (name, created_by, updated_by)
     VALUES (?, ?, ?)`,
    [name, actorId ?? null, actorId ?? null]
  );

  return getRoleById(result.insertId, true);
};

export const getAllRoles = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `SELECT role_id, name, created_at, updated_at, created_by, updated_by, is_deleted
     FROM roles
     WHERE (? = 1 OR is_deleted = 0)
     ORDER BY role_id ASC`,
    [includeDeleted ? 1 : 0]
  );

  return rows.map(normalizeRole);
};

export const getRoleById = async (roleId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `SELECT role_id, name, created_at, updated_at, created_by, updated_by, is_deleted
     FROM roles
     WHERE role_id = ? AND (? = 1 OR is_deleted = 0)
     LIMIT 1`,
    [roleId, includeDeleted ? 1 : 0]
  );

  return rows.length ? normalizeRole(rows[0]) : null;
};

export const updateRole = async ({ roleId, name, actorId }) => {
  const [result] = await db.execute(
    `UPDATE roles
     SET name = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE role_id = ? AND is_deleted = 0`,
    [name, actorId ?? null, roleId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getRoleById(roleId, true);
};

export const softDeleteRole = async ({ roleId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE roles
     SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE role_id = ? AND is_deleted = 0`,
    [actorId ?? null, roleId]
  );

  return result.affectedRows > 0;
};

export const restoreRole = async ({ roleId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE roles
     SET is_deleted = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE role_id = ? AND is_deleted = 1`,
    [actorId ?? null, roleId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getRoleById(roleId, true);
};
