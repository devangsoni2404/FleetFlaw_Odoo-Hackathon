import db from '../configs/db.js';

const normalizeExpense = (row) => ({
  expense_id: row.expense_id,
  expense_code: row.expense_code,
  vehicle_id: row.vehicle_id,
  trip_id: row.trip_id,
  maintenance_id: row.maintenance_id,
  driver_id: row.driver_id,
  expense_type: row.expense_type,
  description: row.description,
  amount: row.amount,
  receipt_number: row.receipt_number,
  receipt_photo_url: row.receipt_photo_url,
  expense_date: row.expense_date,
  is_approved: Boolean(row.is_approved),
  approved_by: row.approved_by,
  approved_at: row.approved_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_by: row.created_by,
  updated_by: row.updated_by,
  is_deleted: Boolean(row.is_deleted),
});

export const getAllExpenses = async ({ includeDeleted = false } = {}) => {
  const [rows] = await db.execute(
    `SELECT * FROM expenses WHERE (? = 1 OR is_deleted = 0) ORDER BY expense_date DESC`,
    [includeDeleted ? 1 : 0]
  );
  return rows.map(normalizeExpense);
};

export const getExpenseById = async (expenseId, includeDeleted = false) => {
  const [rows] = await db.execute(
    `SELECT * FROM expenses WHERE expense_id = ? AND (? = 1 OR is_deleted = 0) LIMIT 1`,
    [expenseId, includeDeleted ? 1 : 0]
  );
  return rows.length ? normalizeExpense(rows[0]) : null;
};

export const createExpense = async (expenseData) => {
  const fields = Object.keys(expenseData);
  const placeholders = fields.map(() => '?').join(', ');
  const values = Object.values(expenseData);

  const [result] = await db.execute(
    `INSERT INTO expenses (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return getExpenseById(result.insertId, true);
};

export const updateExpense = async (expenseId, expenseData) => {
  const fields = Object.keys(expenseData);
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = [...Object.values(expenseData), expenseId];

  const [result] = await db.execute(
    `UPDATE expenses SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE expense_id = ? AND is_deleted = 0`,
    values
  );

  if (!result.affectedRows) return null;
  return getExpenseById(expenseId, true);
};

export const softDeleteExpense = async (expenseId, actorId) => {
  const [result] = await db.execute(
    `UPDATE expenses SET is_deleted = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE expense_id = ? AND is_deleted = 0`,
    [actorId ?? null, expenseId]
  );
  return result.affectedRows > 0;
};
