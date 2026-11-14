import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { isValidEmail } from '../utils/security.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'eventease_super_secret_jwt_key_2026_secure',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user (Participant by default; Organizer allowed in dev/demo or with invite)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Role assignment rules:
    // If Admin requested via public registration, strictly reject unless no users exist in database yet (bootstrap)
    let assignedRole = 'Participant';
    const totalUsers = await User.countDocuments();
    
    if (totalUsers === 0) {
      // First user registered becomes Admin
      assignedRole = 'Admin';
    } else if (role && ['Organizer', 'Check-in Staff', 'Participant'].includes(role)) {
      // Allow requested role in non-production, or default to Participant
      if (process.env.NODE_ENV !== 'production' || role === 'Participant') {
        assignedRole = role;
      } else {
        assignedRole = 'Participant';
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedEvents: user.assignedEvents || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedEvents: user.assignedEvents || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      assignedEvents: req.user.assignedEvents || [],
      createdAt: req.user.createdAt,
    },
  });
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't leak user existence
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error processing password reset.' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using reset token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Valid token and new password (min 6 chars) are required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
});

// @route   GET /api/auth/staff
// @desc    List staff members and organizers
// @access  Private (Organizer, Admin)
router.get('/staff', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['Check-in Staff', 'Organizer'] },
    })
      .select('-password')
      .populate('assignedEvents', 'name eventId date venue');

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve staff members.' });
  }
});

// @route   POST /api/auth/staff
// @desc    Create a new staff member account directly
// @access  Private (Organizer, Admin)
router.post('/staff', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const { name, email, password, assignedEventIds, role = 'Check-in Staff' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const staffMember = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: ['Check-in Staff', 'Organizer'].includes(role) ? role : 'Check-in Staff',
      assignedEvents: Array.isArray(assignedEventIds) ? assignedEventIds : [],
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully.',
      user: {
        id: staffMember._id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        assignedEvents: staffMember.assignedEvents,
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff account.' });
  }
});

export default router;
