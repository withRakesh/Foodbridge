const express = require('express');
const router = express.Router();
const { registerUser, loginUser} = require('../controllers/authController');
const { protect, authorize} = require('../middleware/authMiddleware');
const { registerValidationRules, loginValidationRules, validate } = require('../validations/authValidation');
const { authLimiter } = require('../middleware/rateLimiter');
 
router.post('/register', authLimiter, registerValidationRules, validate, registerUser);
router.post('/login', authLimiter, loginValidationRules, validate, loginUser);

// Temporary test route — will remove later
router.get('/me', protect, (req, res) => {
  res.status(200).json({ user: req.user });
});

// Temporary test route — admin only
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome, Admin! You passed the role check.' });
});

module.exports = router;