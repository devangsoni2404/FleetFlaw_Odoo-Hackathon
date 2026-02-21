import {
  ROLE_NAMES,
  createRole,
  findActiveRoleByName,
  getAllRoles,
  getRoleById,
  restoreRole,
  softDeleteRole,
  updateRole,
} from '../models/role.model.js';

const parseRoleId = (value) => Number.parseInt(value, 10);

const isValidRoleName = (name) => ROLE_NAMES.includes(name);

export const listRoles = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const roles = await getAllRoles({ includeDeleted });

    return res.status(200).json({ success: true, data: roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRole = async (req, res) => {
  try {
    const roleId = parseRoleId(req.params.roleId);
    if (Number.isNaN(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role_id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const role = await getRoleById(roleId, includeDeleted);

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    return res.status(200).json({ success: true, data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addRole = async (req, res) => {
  try {
    const { name, created_by } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    if (!isValidRoleName(name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role name. Allowed values: ${ROLE_NAMES.join(', ')}`,
      });
    }

    const existingRole = await findActiveRoleByName(name);
    if (existingRole) {
      return res.status(409).json({ success: false, message: 'Role already exists' });
    }

    const actorId = req.user?.user_id ?? created_by ?? null;
    const role = await createRole({ name, actorId });

    return res.status(201).json({ success: true, data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editRole = async (req, res) => {
  try {
    const roleId = parseRoleId(req.params.roleId);
    if (Number.isNaN(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role_id' });
    }

    const { name, updated_by } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    if (!isValidRoleName(name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role name. Allowed values: ${ROLE_NAMES.join(', ')}`,
      });
    }

    const duplicateRole = await findActiveRoleByName(name);
    if (duplicateRole && duplicateRole.role_id !== roleId) {
      return res.status(409).json({ success: false, message: 'Role already exists' });
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;
    const role = await updateRole({ roleId, name, actorId });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found or deleted' });
    }

    return res.status(200).json({ success: true, data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const roleId = parseRoleId(req.params.roleId);
    if (Number.isNaN(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteRole({ roleId, actorId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Role not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const undeleteRole = async (req, res) => {
  try {
    const roleId = parseRoleId(req.params.roleId);
    if (Number.isNaN(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const role = await restoreRole({ roleId, actorId });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found or not deleted' });
    }

    return res.status(200).json({ success: true, data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
