    const Institution = require('../models/Institution');

// @desc    Create a new beneficiary institution
// @route   POST /api/institutions
// @access  Private/NGO
const createInstitution = async (req, res) => {
  try {
    const { name, type, address, contactPerson, contactPhone } = req.body;

    if (!name || !type || !address) {
      return res.status(400).json({ message: 'name, type, and address are required' });
    }

    const institution = await Institution.create({
      ngo: req.user._id,
      name,
      type,
      address,
      contactPerson,
      contactPhone,
    });

    res.status(201).json({ message: 'Institution created successfully', institution });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all institutions belonging to the logged-in NGO
// @route   GET /api/institutions
// @access  Private/NGO
const getMyInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find({ ngo: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({ count: institutions.length, institutions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createInstitution, getMyInstitutions };