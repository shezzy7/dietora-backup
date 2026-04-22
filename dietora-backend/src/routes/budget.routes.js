// src/routes/budget.routes.js

const express = require('express');
const router = express.Router();
const { getBudgetSummary, optimizeBudget, updateBudget } = require('../controllers/budget.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// @route GET /api/v1/budget/summary
router.get('/summary', getBudgetSummary);

// @route POST /api/v1/budget/optimize
router.post('/optimize', optimizeBudget);

// @route PUT /api/v1/budget/update
router.put('/update', updateBudget);

module.exports = router;
