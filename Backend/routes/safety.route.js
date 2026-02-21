import { Router } from 'express';
import {
  getSafetyDashboard,
  listExpiredLicenseDrivers,
  listSafetyDrivers,
  updateSafetyDriverScore,
  updateSafetyDriverStatus,
} from '../controllers/safety.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import {
  validateDriverStatusUpdate,
  validateIdParam,
  validateSafetyScoreUpdate,
} from '../middleware/request-validation.middleware.js';

const safetyRouter = Router();

safetyRouter.get('/dashboard', protect, allowRoles('Safety Officer'), getSafetyDashboard);
safetyRouter.get('/drivers', protect, allowRoles('Safety Officer'), listSafetyDrivers);
safetyRouter.get('/drivers/expired', protect, allowRoles('Safety Officer'), listExpiredLicenseDrivers);
safetyRouter.patch(
  '/drivers/:id/status',
  protect,
  allowRoles('Safety Officer'),
  validateIdParam('id'),
  validateDriverStatusUpdate,
  updateSafetyDriverStatus
);
safetyRouter.patch(
  '/drivers/:id/score',
  protect,
  allowRoles('Safety Officer'),
  validateIdParam('id'),
  validateSafetyScoreUpdate,
  updateSafetyDriverScore
);

export default safetyRouter;
