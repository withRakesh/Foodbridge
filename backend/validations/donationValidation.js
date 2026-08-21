const { body } = require('express-validator');

const createDonationValidationRules = [
  body('foodName').trim().notEmpty().withMessage('Food name is required'),
  body('quantity').trim().notEmpty().withMessage('Quantity is required'),
  body('preparedTime')
    .notEmpty().withMessage('Prepared time is required')
    .isISO8601({ strict: true }).withMessage('Prepared time must be a full date in format YYYY-MM-DDTHH:mm:ss.sssZ'),
  body('expiryTime')
    .notEmpty().withMessage('Expiry time is required')
    .isISO8601({ strict: true }).withMessage('Expiry time must be a full date in format YYYY-MM-DDTHH:mm:ss.sssZ'),
  body('location').notEmpty().withMessage('Location is required'),
];

module.exports = { createDonationValidationRules };