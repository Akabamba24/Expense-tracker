const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');

// @desc    Get all expenses for the logged-in user
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    // We only find expenses where the 'user' field matches the ID from the token
    const expenses = await Expense.find({ user: req.user.id });
    res.status(200).json(expenses);
});

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const setExpense = asyncHandler(async (req, res) => {
    const { text, amount, category } = req.body;

    if (!text || !amount || !category) {
        res.status(400);
        throw new Error('Please add a text, amount, and category');
    }

    const expense = await Expense.create({
        text,
        amount,
        category,
        user: req.user.id, // Links the expense to the user who created it
    });

    res.status(201).json(expense);
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }

    // Security Check: Make sure the logged-in user owns this expense
    if (expense.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized to update this expense');
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Returns the updated version of the document
    });

    res.status(200).json(updatedExpense);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }

    // Security Check: Make sure the logged-in user owns this expense
    if (expense.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized to delete this expense');
    }

    await expense.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Expense deleted successfully' });
});

module.exports = {
    getExpenses,
    setExpense,
    updateExpense,
    deleteExpense,
};