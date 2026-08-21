const express = require('express');
const router = express.Router();
const { createInstitution, getMyInstitutions } = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('ngo'), createInstitution);
router.get('/', protect, authorize('ngo'), getMyInstitutions);

module.exports = router;