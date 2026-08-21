const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user (password auto-hashed via pre-save hook)
    const user = await User.create({ name, email, password, role });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been disabled. Contact support.' });
    }

if ((user.role === 'restaurant' || user.role === 'ngo') && user.approvalStatus !== 'approved') {
  return res.status(403).json({
    message:
      user.approvalStatus === 'rejected'
        ? 'Your account application was rejected. Contact support.'
        : 'Your account is pending admin approval',
  });
}

    const token = generateToken(user._id, user.role);

 res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  approvalStatus: user.approvalStatus,
  token,
});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser };
 