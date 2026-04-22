// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const {
  register, login, googleAuth, getMe, changePassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// ─── Public ───────────────────────────────────────────────
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Google OAuth — no validation middleware needed (credential is a raw JWT string)
router.post('/google', googleAuth);

// ─── Private ──────────────────────────────────────────────
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
