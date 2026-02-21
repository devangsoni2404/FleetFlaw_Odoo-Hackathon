import { Router } from 'express';
import {
  addVehicle,
  changeVehicleStatus,
  deleteVehicle,
  editVehicle,
  getVehicle,
  listVehicles,
} from '../controllers/vehicle.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import {
  validateIdParam,
  validateVehicleCreate,
  validateVehicleStatusUpdate,
  validateVehicleUpdate,
} from '../middleware/request-validation.middleware.js';

const vehicleRouter = Router();

vehicleRouter.post('/', protect, allowRoles('Manager', 'Dispatcher'), validateVehicleCreate, addVehicle);
vehicleRouter.get('/', protect, listVehicles);
vehicleRouter.get('/:id', protect, validateIdParam('id'), getVehicle);
vehicleRouter.put('/:id', protect, allowRoles('Manager', 'Dispatcher'), validateIdParam('id'), validateVehicleUpdate, editVehicle);
vehicleRouter.patch(
  '/:id/status',
  protect,
  allowRoles('Manager', 'Dispatcher', 'Safety Officer'),
  validateIdParam('id'),
  validateVehicleStatusUpdate,
  changeVehicleStatus
);
vehicleRouter.delete('/:id', protect, allowRoles('Manager'), validateIdParam('id'), deleteVehicle);

export default vehicleRouter;
