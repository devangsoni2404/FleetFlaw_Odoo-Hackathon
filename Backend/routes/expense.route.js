import { Router } from 'express';
import {
  addExpense,
  deleteExpense,
  editExpense,
  getExpense,
  listExpenses,
} from '../controllers/expense.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';

const expenseRouter = Router();

// Apply protect to all expense routes
expenseRouter.use(protect);

expenseRouter.get('/', allowRoles('Manager', 'Dispatcher', 'Financial Analyst'), listExpenses);
expenseRouter.get('/:expenseId', allowRoles('Manager', 'Dispatcher', 'Financial Analyst'), getExpense);
expenseRouter.post('/', allowRoles('Manager', 'Dispatcher', 'Driver', 'Financial Analyst'), addExpense);
expenseRouter.put('/:expenseId', allowRoles('Manager', 'Dispatcher', 'Driver', 'Financial Analyst'), editExpense);
expenseRouter.delete('/:expenseId', allowRoles('Manager', 'Dispatcher'), deleteExpense);

export default expenseRouter;
