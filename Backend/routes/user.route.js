import { Router } from 'express';
import {
  addUser,
  deleteUser,
  editMyProfile,
  editUser,
  getUser,
  listUsers,
  loginUser,
  undeleteUser,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';

const userRouter = Router();

userRouter.post('/login', loginUser);

userRouter.get('/', protect, allowRoles('Manager'), listUsers);
userRouter.get('/:userId', protect, allowRoles('Manager'), getUser);
userRouter.post('/', protect, allowRoles('Manager'), addUser);
userRouter.put('/me', protect, editMyProfile);
userRouter.put('/:userId', protect, allowRoles('Manager'), editUser);
userRouter.delete('/:userId', protect, allowRoles('Manager'), deleteUser);
userRouter.patch('/:userId/restore', protect, allowRoles('Manager'), undeleteUser);

export default userRouter;
