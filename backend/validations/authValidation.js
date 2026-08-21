const { body, validationResult } = require('express-validator');

const registerValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['restaurant', 'ngo', 'volunteer'])
    .withMessage('Role must be restaurant, ngo, or volunteer'),
];

const loginValidationRules = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

module.exports = { registerValidationRules, loginValidationRules, validate };