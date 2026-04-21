const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// These controller functions (getExpenses, setExpense, etc.)
// will be created in the next step.
const {
    getExpenses,
    setExpense,
    updateExpense,
    deleteExpense,
} = require('../controllers/expenseController');

// All routes here are private and require a token
router.route('/').get(protect, getExpenses).post(protect, setExpense);
router.route('/:id').put(protect, updateExpense).delete(protect, deleteExpense);

module.exports = router;