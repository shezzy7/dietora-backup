// src/controllers/budget.controller.js

const HealthProfile = require('../models/HealthProfile');
const MealPlan = require('../models/MealPlan');
const FoodItem = require('../models/FoodItem');
const { successResponse } = require('../utils/response.utils');

/**
 * @route   GET /api/v1/budget/summary
 * @desc    Get budget analysis for current active meal plan
 * @access  Private
 */
const getBudgetSummary = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Health profile not found.' });
    }

    const plan = await MealPlan.findOne({ user: req.user._id, status: 'active' });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'No active meal plan found.' });
    }

    const weeklyBudget = profile.dailyBudget * 7;
    const budgetUsed = plan.weeklyTotalCost;
    const budgetRemaining = weeklyBudget - budgetUsed;
    const budgetUsedPct = parseFloat(((budgetUsed / weeklyBudget) * 100).toFixed(1));

    const summary = {
      dailyBudget: profile.dailyBudget,
      weeklyBudget,
      avgDailyCost: plan.avgDailyCost,
      weeklyTotalCost: plan.weeklyTotalCost,
      budgetRemaining: parseFloat(budgetRemaining.toFixed(2)),
      budgetUsedPercentage: budgetUsedPct,
      isWithinBudget: budgetUsed <= weeklyBudget,
      perDayBreakdown: plan.days.map((d) => ({
        day: d.day,
        dayName: d.dayName,
        cost: d.totalCost,
        withinBudget: d.totalCost <= profile.dailyBudget,
      })),
    };

    return successResponse(res, summary, 'Budget summary fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/budget/optimize
 * @desc    Suggest cheaper food alternatives within budget
 * @access  Private
 */
const optimizeBudget = async (req, res, next) => {
  try {
    const { targetBudget } = req.body;
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Health profile not found.' });
    }

    const budget = targetBudget || profile.dailyBudget;

    // Find affordable foods within budget
    let query = { isAvailable: true, price: { $lte: budget * 0.4 } };
    if (profile.isDiabetic) query.is_diabetic_safe = true;
    if (profile.isHypertensive) query.is_hypertension_safe = true;
    if (profile.isCardiac) query.is_cardiac_safe = true;

    const affordableFoods = await FoodItem.find(query)
      .sort({ price: 1 })
      .limit(20)
      .select('name calories protein carbs fat price category mealType servingSize');

    const grouped = {
      breakfast: affordableFoods.filter((f) => f.mealType.includes('breakfast')),
      lunch: affordableFoods.filter((f) => f.mealType.includes('lunch')),
      dinner: affordableFoods.filter((f) => f.mealType.includes('dinner')),
      snack: affordableFoods.filter((f) => f.mealType.includes('snack')),
    };

    const estimatedDailyCost =
      (grouped.breakfast[0]?.price || 0) +
      (grouped.lunch[0]?.price || 0) +
      (grouped.dinner[0]?.price || 0) +
      (grouped.snack[0]?.price || 0);

    return successResponse(
      res,
      {
        targetBudget: budget,
        estimatedDailyCost: parseFloat(estimatedDailyCost.toFixed(2)),
        suggestions: grouped,
        tip: 'Regenerate your meal plan with updated budget to apply these suggestions.',
      },
      'Budget optimization suggestions ready'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/budget/update
 * @desc    Update daily budget in health profile
 * @access  Private
 */
const updateBudget = async (req, res, next) => {
  try {
    const { dailyBudget } = req.body;
    if (!dailyBudget || dailyBudget < 100) {
      return res.status(400).json({
        success: false,
        message: 'Daily budget must be at least PKR 100.',
      });
    }

    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      { dailyBudget },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Health profile not found.' });
    }

    return successResponse(
      res,
      { dailyBudget: profile.dailyBudget },
      'Budget updated! Regenerate your meal plan to apply changes.'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudgetSummary, optimizeBudget, updateBudget };
