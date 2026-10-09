const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT and authenticate the requesting user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Please contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific user roles.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user ? req.user.role : 'unauthenticated'}' does not have permission to access this resource`,
      });
    }
    next();
  };
};

/**
 * Middleware to check resource ownership.
 * Admin role bypasses the ownership check.
 * @param {Function} getModel - Function returning the Mongoose model
 * @param {String} paramKey - URL param containing resource id (e.g., 'id' or 'jobId')
 * @param {String} ownerField - Document field containing owner User ObjectId (e.g., 'recruiter' or 'user')
 */
const checkOwnership = (getModel, paramKey = 'id', ownerField = 'user') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[paramKey];
      const Model = getModel();
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Requested resource not found',
        });
      }

      const ownerId = resource[ownerField]?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this resource',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  checkOwnership,
};
