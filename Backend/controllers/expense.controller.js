import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  softDeleteExpense,
} from '../models/expense.model.js';
import { updateTripExpenseCost } from '../models/trip.model.js';

const parseExpenseId = (value) => Number.parseInt(value, 10);

export const listExpenses = async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const expenses = await getAllExpenses({ includeDeleted });
    return res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpense = async (req, res) => {
  try {
    const expenseId = parseExpenseId(req.params.expenseId);
    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ success: false, message: 'Invalid expense_id' });
    }

    const includeDeleted = req.query.include_deleted === 'true';
    const expense = await getExpenseById(expenseId, includeDeleted);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    return res.status(200).json({ success: true, data: expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const expenseData = req.body;
    
    // Basic validation
    if (!expenseData.expense_type || !expenseData.amount || !expenseData.expense_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'expense_type, amount, and expense_date are required' 
      });
    }

    const actorId = req.user?.user_id ?? expenseData.created_by ?? null;
    const expense = await createExpense({ ...expenseData, created_by: actorId, updated_by: actorId });

    if (expense && expense.trip_id) {
      // Auto-update parent trip total_expense_cost
      await updateTripExpenseCost(expense.trip_id);
    }

    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editExpense = async (req, res) => {
  try {
    const expenseId = parseExpenseId(req.params.expenseId);
    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ success: false, message: 'Invalid expense_id' });
    }

    const expenseData = req.body;
    const actorId = req.user?.user_id ?? expenseData.updated_by ?? null;
    
    const trip = await updateExpense(expenseId, { ...expenseData, updated_by: actorId });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Expense not found or deleted' });
    }

    if (trip.trip_id) {
      // Auto-update parent trip total_expense_cost
      await updateTripExpenseCost(trip.trip_id);
    }

    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expenseId = parseExpenseId(req.params.expenseId);
    if (Number.isNaN(expenseId)) {
      return res.status(400).json({ success: false, message: 'Invalid expense_id' });
    }

    const actorId = req.user?.user_id ?? req.body.updated_by ?? null;
    const deleted = await softDeleteExpense(expenseId, actorId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
