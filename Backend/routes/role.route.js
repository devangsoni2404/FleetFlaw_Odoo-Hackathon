import { Router } from 'express';
import {
  addRole,
  deleteRole,
  editRole,
  getRole,
  listRoles,
  undeleteRole,
} from '../controllers/role.controller.js';

const roleRouter = Router();

roleRouter.get('/', listRoles);
roleRouter.get('/:roleId', getRole);
roleRouter.post('/', addRole);
roleRouter.put('/:roleId', editRole);
roleRouter.delete('/:roleId', deleteRole);
roleRouter.patch('/:roleId/restore', undeleteRole);

export default roleRouter;
