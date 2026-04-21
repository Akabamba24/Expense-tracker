const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getBudget, setBudget, getBudgetHistory } = require('../controllers/budgetController');

router.get('/', protect, getBudget);
router.post('/', protect, setBudget);
router.get('/history', protect, getBudgetHistory);

module.exports = router;
