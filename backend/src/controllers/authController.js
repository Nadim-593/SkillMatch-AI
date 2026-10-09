const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'candidate' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // If candidate, initialize empty profile
    if (user.role === 'candidate') {
      await CandidateProfile.create({
        user: user._id,
        headline: '',
        summary: '',
        confirmedSkills: [],
        experience: [],
        education: [],
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email including hashed password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Please contact support.',
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private (Requires JWT)
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user.toSafeJSON();

    let profile = null;
    if (req.user.role === 'candidate') {
      profile = await CandidateProfile.findOne({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Signed out successfully',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
