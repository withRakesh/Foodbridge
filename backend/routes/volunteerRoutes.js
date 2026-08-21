const express = require('express');
const router = express.Router();
const { getAvailableVolunteers } = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/available', protect, authorize('ngo'), getAvailableVolunteers);

module.exports = router;