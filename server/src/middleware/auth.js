import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'eventease_super_secret_jwt_key_2026_secure'
    );
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: User is not authenticated.',
      });
    }

    // Admin always has universal access across all endpoints
    if (req.user.role === 'Admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

/**
 * Ensures Check-in Staff can only operate on events assigned to them.
 * Admin and Organizer bypass this event-specific check.
 */
export const authorizeEventStaff = (getEventIdFromReq) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'Admin' || req.user.role === 'Organizer') {
      return next();
    }

    if (req.user.role === 'Check-in Staff') {
      // If staff has explicit assignments, enforce them
      if (req.user.assignedEvents && req.user.assignedEvents.length > 0) {
        const targetEventId = getEventIdFromReq ? getEventIdFromReq(req) : (req.body.eventId || req.params.id);
        if (targetEventId) {
          const isAssigned = req.user.assignedEvents.some(
            (id) => id.toString() === targetEventId.toString()
          );
          if (!isAssigned) {
            return res.status(403).json({
              success: false,
              message: 'Forbidden: You are not assigned to manage check-ins for this event.',
            });
          }
        }
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Insufficient permissions for event gate check-in.',
    });
  };
};
