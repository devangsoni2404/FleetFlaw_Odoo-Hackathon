import { Router } from 'express';
import {
  addDriver,
  changeDriverStatus,
  deleteDriver,
  editDriver,
  getDriver,
  listDrivers,
} from '../controllers/driver.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import {
  validateDriverCreate,
  validateDriverStatusUpdate,
  validateDriverUpdate,
  validateIdParam,
} from '../middleware/request-validation.middleware.js';

const driverRouter = Router();

driverRouter.post('/', protect, allowRoles('Manager', 'Dispatcher'), validateDriverCreate, addDriver);
driverRouter.get('/', protect, listDrivers);
driverRouter.get('/:id', protect, validateIdParam('id'), getDriver);
driverRouter.put('/:id', protect, allowRoles('Manager', 'Dispatcher'), validateIdParam('id'), validateDriverUpdate, editDriver);
driverRouter.patch(
  '/:id/status',
  protect,
  allowRoles('Manager', 'Dispatcher', 'Safety Officer'),
  validateIdParam('id'),
  validateDriverStatusUpdate,
  changeDriverStatus
);
driverRouter.delete('/:id', protect, allowRoles('Manager'), validateIdParam('id'), deleteDriver);

export default driverRouter;
