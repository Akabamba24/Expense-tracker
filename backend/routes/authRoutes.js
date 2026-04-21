// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register -> Runs registerUser controller function
router.post('/register', registerUser);

// POST /api/auth/login -> Runs loginUser controller function
router.post('/login', loginUser);

// GET /api/auth/me -> Runs getMe controller function (Requires token)
router.get('/me', protect, getMe);

module.exports = router;
