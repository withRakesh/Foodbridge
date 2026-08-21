const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const {
  createDonation,
  getMyDonations,
  cancelDonation,
  getAvailableDonations,
  acceptDonation,
  assignVolunteer,
  confirmDelivery,
   getMyAssignments,
  confirmHandover,
  markDelivered,
  getMyNgoDonations,
  getNearbyDonations
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createDonationValidationRules } = require('../validations/donationValidation');
const { validate } = require('../validations/authValidation'); // reusing the same generic validate function

 
router.get('/my-donations', protect, authorize('restaurant'), getMyDonations);
router.put('/:id/cancel', protect, authorize('restaurant'), cancelDonation);
router.get('/available', protect, authorize('ngo'), getAvailableDonations);
router.put('/:id/accept', protect, authorize('ngo'), acceptDonation);
router.put('/:id/assign-volunteer', protect, authorize('ngo'), assignVolunteer);
router.put('/:id/confirm-delivery', protect, authorize('ngo'), confirmDelivery);
router.get('/my-assignments', protect, authorize('volunteer'), getMyAssignments);
router.put('/:id/confirm-handover', protect, authorize('restaurant'), confirmHandover);
router.put('/:id/mark-delivered', protect, authorize('volunteer'), markDelivered);
router.post('/', protect, authorize('restaurant'), upload.single('image'), createDonationValidationRules, validate, createDonation);
router.get('/nearby', protect, authorize('ngo'), getNearbyDonations);
router.get('/my-ngo-donations', protect, authorize('ngo'), getMyNgoDonations);

module.exports = router;