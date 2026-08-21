const User = require('../models/User');
const Donation = require('../models/Donation');

// @desc    Get all users of a given role pending approval
// @route   GET /api/admin/:role/pending
// @access  Private/Admin
const getPendingByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!['restaurant', 'ngo'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "restaurant" or "ngo"' });
    }

    const users = await User.find({
      role,
      approvalStatus: 'pending',
    }).select('-password');

    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve or reject a user of a given role
// @route   PUT /api/admin/:role/:id/status
// @access  Private/Admin
const updateApprovalStatus = async (req, res) => {
  try {
    const { role, id } = req.params;
    const { status } = req.body;

    if (!['restaurant', 'ngo'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "restaurant" or "ngo"' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either "approved" or "rejected"' });
    }

    const user = await User.findOne({ _id: id, role });

    if (!user) {
      return res.status(404).json({ message: `${role} not found` });
    }

    user.approvalStatus = status;
    await user.save();

    res.status(200).json({
      message: `${role} ${status} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users (optionally filter by role)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select('-password');

    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle a user's active status (disable/enable — soft delete)
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot disable an admin account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get platform-wide dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Donations grouped by status
    const donationsByStatus = await Donation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Users grouped by role and approval status
    const usersByRoleAndStatus = await User.aggregate([
      {
        $group: {
          _id: { role: '$role', approvalStatus: '$approvalStatus' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCompletedDonations = await Donation.countDocuments({ status: 'completed' });

    res.status(200).json({
      donationsByStatus,
      usersByRoleAndStatus,
      totalCompletedDonations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all donations with flexible filters (Admin monitoring)
// @route   GET /api/admin/donations?status=..&restaurantId=..&fromDate=..&toDate=..
// @access  Private/Admin
const getAllDonationsAdmin = async (req, res) => {
  try {
    const { status, restaurantId, fromDate, toDate } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (restaurantId) {
      filter.restaurant = restaurantId;
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const donations = await Donation.find(filter)
      .populate('restaurant', 'name email')
      .populate('ngo', 'name email')
      .populate('volunteer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPendingByRole,
  updateApprovalStatus,
  getAllUsers,
  toggleUserActive,
  getDashboardStats,
  getAllDonationsAdmin,
};
 
 

 