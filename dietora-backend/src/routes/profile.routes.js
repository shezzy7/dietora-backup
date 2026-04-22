// src/routes/profile.routes.js

const express = require('express');
const router = express.Router();
const {
  createProfile, getProfile, updateProfile, getProfileSummary,
} = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { profileSchema, updateProfileSchema } = require('../validators/profile.validator');

router.use(protect); // all profile routes require auth

// @route POST /api/v1/profile
router.post('/', validate(profileSchema), createProfile);

// @route GET /api/v1/profile
router.get('/', getProfile);

// @route GET /api/v1/profile/summary
router.get('/summary', getProfileSummary);

// @route PUT /api/v1/profile
router.put('/', validate(updateProfileSchema), updateProfile);

module.exports = router;
