const express = require('express');
const router = express.Router();
const {
  getPendingByRole,
  updateApprovalStatus,
  getAllUsers,
  toggleUserActive,
  getDashboardStats,
  getAllDonationsAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:role/pending', protect, authorize('admin'), getPendingByRole);
router.put('/:role/:id/status', protect, authorize('admin'), updateApprovalStatus);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/toggle-active', protect, authorize('admin'), toggleUserActive);
router.get('/dashboard-stats', protect, authorize('admin'), getDashboardStats);
router.get('/donations', protect, authorize('admin'), getAllDonationsAdmin);

module.exports = router;