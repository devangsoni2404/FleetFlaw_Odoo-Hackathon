import { Router } from 'express';
import {
  addRole,
  deleteRole,
  editRole,
  getRole,
  listRoles,
  undeleteRole,
} from '../controllers/role.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';

const roleRouter = Router();

roleRouter.get('/', listRoles);
roleRouter.get('/:roleId', getRole);

roleRouter.post('/', protect, allowRoles('Manager'), addRole);
roleRouter.put('/:roleId', protect, allowRoles('Manager'), editRole);
roleRouter.delete('/:roleId', protect, allowRoles('Manager'), deleteRole);
roleRouter.patch('/:roleId/restore', protect, allowRoles('Manager'), undeleteRole);

export default roleRouter;
