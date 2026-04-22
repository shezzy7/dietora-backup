// src/routes/grocery.routes.js

const express = require('express');
const router = express.Router();
const {
  generate, getMyList, getById, toggleItem, deleteList,
} = require('../controllers/grocery.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// @route GET /api/v1/grocery-list
router.get('/', getMyList);

// @route POST /api/v1/grocery-list/generate/:mealPlanId
router.post('/generate/:mealPlanId', generate);

// @route GET /api/v1/grocery-list/:id
router.get('/:id', getById);

// @route PATCH /api/v1/grocery-list/:id/item/:itemId/toggle
router.patch('/:id/item/:itemId/toggle', toggleItem);

// @route DELETE /api/v1/grocery-list/:id
router.delete('/:id', deleteList);

module.exports = router;
