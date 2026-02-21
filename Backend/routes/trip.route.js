import { Router } from 'express';
import {
  addTrip,
  deleteTrip,
  editTrip,
  getTrip,
  listTrips,
  dispatchTrip,
} from '../controllers/trip.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';

const tripRouter = Router();

// Apply protect to all trip routes
tripRouter.use(protect);

tripRouter.get('/', allowRoles('Manager', 'Dispatcher', 'Safety Officer'), listTrips);
tripRouter.get('/:tripId', allowRoles('Manager', 'Dispatcher', 'Safety Officer'), getTrip);
tripRouter.post('/', allowRoles('Manager', 'Dispatcher'), addTrip);
tripRouter.put('/:tripId', allowRoles('Manager', 'Dispatcher'), editTrip);
tripRouter.patch('/:tripId/dispatch', allowRoles('Manager', 'Dispatcher'), dispatchTrip);
tripRouter.delete('/:tripId', allowRoles('Manager', 'Dispatcher'), deleteTrip);

export default tripRouter;
