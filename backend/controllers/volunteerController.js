const User = require('../models/User');

// @desc    Get all available volunteers (for NGO to assign)
// @route   GET /api/volunteers/available
// @access  Private/NGO
const getAvailableVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({
      role: 'volunteer',
      isActive: true,
      isAvailable: true,
    }).select('-password');

    res.status(200).json({ count: volunteers.length, volunteers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAvailableVolunteers };