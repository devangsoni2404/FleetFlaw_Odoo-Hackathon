import jwt from 'jsonwebtoken';
import {
  createUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  restoreUser,
  roleExists,
  softDeleteUser,
  updateLastLogin,
  updateUser,
} from '../models/user.model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const parseId = (value) => Number.parseInt(value, 10);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const listUsers = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const users = await getAllUsers({ includeDeleted });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user_id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const user = await getUserById(userId, includeDeleted);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addUser = async (req, res) => {
  try {
    const { role_id, full_name, email, password, is_active, created_by } = req.body;

    if (!role_id || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'role_id, full_name, email, and password are required',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const roleId = parseId(role_id);
    if (Number.isNaN(roleId)) {
      return res.status(400).json({ success: false, message: 'Invalid role_id' });
    }

    const validRole = await roleExists(roleId);
    if (!validRole) {
      return res.status(400).json({ success: false, message: 'role_id does not exist' });
    }

    const existingUser = await getUserByEmail(email, true);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const actorId = req.user?.user_id ?? created_by ?? null;
    const passwordHash = hashPassword(password);

    const user = await createUser({
      roleId,
      fullName: full_name,
      email,
      passwordHash,
      isActive: is_active === undefined ? true : Boolean(is_active),
      actorId,
    });

    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editUser = async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user_id' });
    }

    const { role_id, full_name, email, password, is_active, updated_by } = req.body;

    if (
      role_id === undefined &&
      full_name === undefined &&
      email === undefined &&
      password === undefined &&
      is_active === undefined
    ) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    let roleId;
    if (role_id !== undefined) {
      roleId = parseId(role_id);
      if (Number.isNaN(roleId)) {
        return res.status(400).json({ success: false, message: 'Invalid role_id' });
      }
      const validRole = await roleExists(roleId);
      if (!validRole) {
        return res.status(400).json({ success: false, message: 'role_id does not exist' });
      }
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      const existingUser = await getUserByEmail(email, true);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
    }

    const actorId = req.user?.user_id ?? updated_by ?? null;
    const user = await updateUser({
      userId,
      roleId,
      fullName: full_name,
      email,
      passwordHash: password !== undefined ? hashPassword(password) : undefined,
      isActive: is_active === undefined ? undefined : Boolean(is_active),
      actorId,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or deleted' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editMyProfile = async (req, res) => {
  try {
    const userId = parseId(req.user?.user_id);
    if (Number.isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { full_name, email, password } = req.body;

    if (req.body.role_id !== undefined || req.body.is_active !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'You cannot update role_id or is_active from this endpoint',
      });
    }

    if (full_name === undefined && email === undefined && password === undefined) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      const existingUser = await getUserByEmail(email, true);
      if (existingUser && existingUser.user_id !== userId) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
    }

    const user = await updateUser({
      userId,
      fullName: full_name,
      email,
      passwordHash: password !== undefined ? hashPassword(password) : undefined,
      actorId: userId,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or deleted' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteUser({ userId, actorId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const undeleteUser = async (req, res) => {
  try {
    const userId = parseId(req.params.userId);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const user = await restoreUser({ userId, actorId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or not deleted' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await getUserByEmail(email, false);
    if (!user || !user.is_active || user.is_deleted) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const validPassword = verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await updateLastLogin(user.user_id);

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role_id: user.role_id,
        role_name: user.role_name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        role_id: user.role_id,
        role_name: user.role_name,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
