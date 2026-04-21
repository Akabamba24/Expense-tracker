const asyncHandler = require('express-async-handler');
const Budget = require('../models/Budget');

const getBudget = asyncHandler(async (req, res) => {
    const { month } = req.query;

    if (!month) {
        res.status(400);
        throw new Error('Month is required');
    }

    const budget = await Budget.findOne({ user: req.user.id, monthKey: month });
    res.status(200).json({
        monthKey: month,
        amount: budget ? budget.amount : 0,
        hasBudget: Boolean(budget),
    });
});

const setBudget = asyncHandler(async (req, res) => {
    const { monthKey, amount } = req.body;

    if (!monthKey || amount === undefined) {
        res.status(400);
        throw new Error('Month and amount are required');
    }

    if (Number(amount) < 0) {
        res.status(400);
        throw new Error('Budget must be zero or greater');
    }

    const budget = await Budget.findOneAndUpdate(
        { user: req.user.id, monthKey },
        {
            user: req.user.id,
            monthKey,
            amount: Number(amount),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(budget);
});

const getBudgetHistory = asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ user: req.user.id }).sort({ monthKey: -1 }).limit(12);
    res.status(200).json(budgets);
});

module.exports = {
    getBudget,
    setBudget,
    getBudgetHistory,
};
