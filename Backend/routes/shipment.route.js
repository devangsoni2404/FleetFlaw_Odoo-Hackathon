import { Router } from 'express';
import {
  addShipment,
  deleteShipment,
  editShipment,
  getShipment,
  listShipments,
  undeleteShipment,
} from '../controllers/shipment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';

const shipmentRouter = Router();

// Apply protect to all shipment routes
shipmentRouter.use(protect);

shipmentRouter.get('/', allowRoles('Manager', 'Dispatcher', 'Safety Officer'), listShipments);
shipmentRouter.get('/:shipmentId', allowRoles('Manager', 'Dispatcher', 'Safety Officer'), getShipment);
shipmentRouter.post('/', allowRoles('Manager', 'Dispatcher'), addShipment);
shipmentRouter.put('/:shipmentId', allowRoles('Manager', 'Dispatcher'), editShipment);
shipmentRouter.delete('/:shipmentId', allowRoles('Manager'), deleteShipment);
shipmentRouter.patch('/:shipmentId/restore', allowRoles('Manager'), undeleteShipment);

export default shipmentRouter;
