// src/routes/admin.routes.js

const express = require('express');
const router = express.Router();
const {
  createFood, getAllFoods, getFoodById, updateFood, deleteFood,
  getAllUsers, getUserById, toggleUserStatus,
  getAnalytics,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { foodSchema, updateFoodSchema } = require('../validators/food.validator');

// All admin routes — must be logged in AND have admin role
router.use(protect, authorize('admin'));

// ─── Food CRUD ────────────────────────────────────────────
router.post('/foods', validate(foodSchema), createFood);
router.get('/foods', getAllFoods);
router.get('/foods/:id', getFoodById);
router.put('/foods/:id', validate(updateFoodSchema), updateFood);
router.delete('/foods/:id', deleteFood);

// ─── User Management ──────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/toggle', toggleUserStatus);

// ─── Analytics ────────────────────────────────────────────
router.get('/analytics', getAnalytics);

module.exports = router;
