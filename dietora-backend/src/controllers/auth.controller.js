// src/controllers/auth.controller.js

const axios = require('axios');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt.utils');

// ═══════════════════════════════════════════════════════════
//  GOOGLE OAUTH HELPER
// ═══════════════════════════════════════════════════════════

/**
 * fetchGoogleUserInfo
 * Calls Google's userinfo endpoint with the access_token obtained
 * from the browser (implicit flow). Returns verified user data.
 *
 * Endpoint: https://www.googleapis.com/oauth2/v3/userinfo
 * This is simpler than verifying an ID token and works perfectly
 * with the implicit flow from @react-oauth/google.
 */
const fetchGoogleUserInfo = async (accessToken) => {
  const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 8000,
  });
  return res.data;
  // Returns: { sub, name, email, picture, email_verified, ... }
};

// ═══════════════════════════════════════════════════════════
//  EMAIL / PASSWORD AUTH
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.authProvider === 'google') {
        return res.status(409).json({
          success: false,
          message: 'This email is already linked to a Google account. Please sign in with Google.',
        });
      }
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'local',
      isEmailVerified: false,
    });

    sendTokenResponse(user, 201, res, 'Registration successful! Welcome to DIETORA 🥗');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.authProvider === 'google') {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please click "Continue with Google".',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/auth/google
 * @desc    Verify Google access token → upsert user in MongoDB → return JWT
 * @access  Public
 *
 * Request body: { accessToken: string }
 *
 * Data stored in MongoDB for Google users:
 *   name          — from Google profile
 *   email         — from Google (lowercase, unique)
 *   googleId      — Google's unique user ID (sub field)
 *   avatar        — Google profile picture URL
 *   authProvider  — 'google'
 *   isEmailVerified — true (Google has already verified it)
 *   role          — 'user' (default)
 *   isActive      — true
 *   lastLogin     — Date.now()
 *   password      — intentionally omitted
 */
const googleAuth = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google access token is required.',
      });
    }

    // ── 1. Verify access token by calling Google's userinfo API ──
    let googleUser;
    try {
      googleUser = await fetchGoogleUserInfo(accessToken);
    } catch (err) {
      console.error('[Google Auth] Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token. Please sign in again.',
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified,
    } = googleUser;

    // Validate we got the fields we need
    if (!googleId || !email || !name) {
      return res.status(401).json({
        success: false,
        message: 'Incomplete data received from Google. Please try again.',
      });
    }

    if (!email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Your Google account email is not verified. Please verify it with Google first.',
      });
    }

    // ── 2. Find existing user by googleId OR email ────────
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    let isNewUser = false;

    if (user) {
      // ── 3a. Existing user — update Google fields ─────────
      const updates = { lastLogin: new Date() };

      if (!user.googleId) {
        // Previously registered with email/password → link Google to their account
        updates.googleId = googleId;
        updates.authProvider = 'google';
        updates.isEmailVerified = true;
      }
      // Refresh avatar from Google (it can change)
      if (avatar && user.avatar !== avatar) {
        updates.avatar = avatar;
      }
      if (!user.isEmailVerified) {
        updates.isEmailVerified = true;
      }

      user = await User.findByIdAndUpdate(user._id, updates, {
        new: true,
        runValidators: false, // skip validation since password isn't provided
      });
    } else {
      // ── 3b. New user — create from Google data ────────────
      user = await User.create({
        name:            name,
        email:           email.toLowerCase(),
        googleId:        googleId,
        avatar:          avatar || '',
        authProvider:    'google',
        isEmailVerified: true,
        role:            'user',
        isActive:        true,
        lastLogin:       new Date(),
        // password intentionally NOT set — Google users don't need it
      });
      isNewUser = true;
    }

    // ── 4. Check account is active ────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    // ── 5. Issue DIETORA JWT ──────────────────────────────
    const firstName = name.split(' ')[0];
    const message = isNewUser
      ? `Welcome to DIETORA, ${firstName}! Your account has been created. 🎉`
      : `Welcome back, ${firstName}! 👋`;

    sendTokenResponse(user, 200, res, message);

  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('healthProfile');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/auth/change-password
 * @access  Private (local users only)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Google Sign-In accounts do not use a password.',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleAuth, getMe, changePassword };
