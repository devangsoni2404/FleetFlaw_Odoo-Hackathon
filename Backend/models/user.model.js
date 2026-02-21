import db from '../configs/db.js';

const userSelect = `
  SELECT u.user_id, u.role_id, r.name AS role_name, u.full_name, u.email,
         u.is_active, u.last_login, u.created_at, u.updated_at,
         u.created_by, u.updated_by, u.is_deleted
  FROM users u
  LEFT JOIN roles r ON r.role_id = u.role_id
`;

const userSelectWithPassword = `
  SELECT u.user_id, u.role_id, r.name AS role_name, u.full_name, u.email,
         u.password_hash, u.is_active, u.last_login, u.created_at, u.updated_at,
         u.created_by, u.updated_by, u.is_deleted
  FROM users u
  LEFT JOIN roles r ON r.role_id = u.role_id
`;

const normalizeUser = (row) => ({
  user_id: row.user_id,
  role_id: row.role_id,
  role_name: row.role_name,
  full_name: row.full_name,
  email: row.email,
  is_active: Boolean(row.is_active),
  last_login: row.last_login,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

export const getAllUsers = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `${userSelect}
     WHERE (? = 1 OR u.is_deleted = 0)
     ORDER BY u.user_id ASC`,
    [includeDeleted ? 1 : 0]
  );

  return rows.map(normalizeUser);
};

export const getUserById = async (userId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `${userSelect}
     WHERE u.user_id = ? AND (? = 1 OR u.is_deleted = 0)
     LIMIT 1`,
    [userId, includeDeleted ? 1 : 0]
  );

  return rows.length ? normalizeUser(rows[0]) : null;
};

export const getUserByEmail = async (email, includeDeleted = true) => {
  const [rows] = await db.execute(
    `${userSelectWithPassword}
     WHERE u.email = ? AND (? = 1 OR u.is_deleted = 0)
     LIMIT 1`,
    [email, includeDeleted ? 1 : 0]
  );

  if (!rows.length) {
    return null;
  }

  return {
    ...normalizeUser(rows[0]),
    password_hash: rows[0].password_hash,
  };
};

export const roleExists = async (roleId) => {
  const [rows] = await db.execute(
    `SELECT role_id FROM roles WHERE role_id = ? AND is_deleted = 0 LIMIT 1`,
    [roleId]
  );

  return rows.length > 0;
};

export const createUser = async ({ roleId, fullName, email, passwordHash, isActive, actorId }) => {
  const [result] = await db.execute(
    `INSERT INTO users (role_id, full_name, email, password_hash, is_active, created_at, updated_at, created_by, updated_by, is_deleted)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, 0)`,
    [roleId, fullName, email, passwordHash, isActive ? 1 : 0, actorId ?? null, actorId ?? null]
  );

  return getUserById(result.insertId, true);
};

export const updateUser = async ({ userId, roleId, fullName, email, passwordHash, isActive, actorId }) => {
  const fields = [];
  const values = [];

  if (roleId !== undefined) {
    fields.push('role_id = ?');
    values.push(roleId);
  }
  if (fullName !== undefined) {
    fields.push('full_name = ?');
    values.push(fullName);
  }
  if (email !== undefined) {
    fields.push('email = ?');
    values.push(email);
  }
  if (passwordHash !== undefined) {
    fields.push('password_hash = ?');
    values.push(passwordHash);
  }
  if (isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(isActive ? 1 : 0);
  }

  fields.push('updated_by = ?');
  values.push(actorId ?? null);
  fields.push('updated_at = CURRENT_TIMESTAMP');

  const [result] = await db.execute(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE user_id = ? AND is_deleted = 0`,
    [...values, userId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getUserById(userId, true);
};

export const softDeleteUser = async ({ userId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE users
     SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND is_deleted = 0`,
    [actorId ?? null, userId]
  );

  return result.affectedRows > 0;
};

export const restoreUser = async ({ userId, actorId }) => {
  const [result] = await db.execute(
    `UPDATE users
     SET is_deleted = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND is_deleted = 1`,
    [actorId ?? null, userId]
  );

  if (!result.affectedRows) {
    return null;
  }

  return getUserById(userId, true);
};

export const updateLastLogin = async (userId) => {
  await db.execute(
    `UPDATE users
     SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [userId]
  );
};
