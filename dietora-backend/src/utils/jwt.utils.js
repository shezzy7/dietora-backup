// src/utils/jwt.utils.js

const jwt = require('jsonwebtoken');

/**
 * generateToken — signs a DIETORA JWT
 */
const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * sendTokenResponse — unified token response for all auth flows
 * (email/password + Google OAuth)
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
      authProvider: user.authProvider || 'local',
      isEmailVerified: user.isEmailVerified || false,
    },
  });
};

module.exports = { generateToken, sendTokenResponse };
