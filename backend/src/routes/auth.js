const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');

const {
  registerValidation,
  loginValidation,
} = require('../validators/authValidator');

const { authenticate, authorizeRoles } = require('../middleware/auth');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Authenticated user routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

// Role-protected test routes for verifying role-based authorization
router.get('/role-test/candidate', authenticate, authorizeRoles('candidate'), (req, res) => {
  res.json({ success: true, message: 'Welcome candidate', user: req.user.toSafeJSON() });
});

router.get('/role-test/recruiter', authenticate, authorizeRoles('recruiter'), (req, res) => {
  res.json({ success: true, message: 'Welcome recruiter', user: req.user.toSafeJSON() });
});

router.get('/role-test/admin', authenticate, authorizeRoles('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome admin', user: req.user.toSafeJSON() });
});

module.exports = router;
