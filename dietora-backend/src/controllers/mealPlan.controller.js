// src/controllers/mealPlan.controller.js

const MealPlan = require('../models/MealPlan');
const HealthProfile = require('../models/HealthProfile');
const { generateMealPlan } = require('../services/mealPlanner.service');
const { successResponse, paginatedResponse } = require('../utils/response.utils');

/**
 * @route   POST /api/v1/meal-plans/generate
 * @desc    AI-generate a 7-day meal plan based on health profile
 * @access  Private
 */
const generate = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please create your health profile first before generating a meal plan.',
      });
    }

    // Archive previous active plan
    await MealPlan.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'archived' }
    );

    // Run AI planner pipeline
    const planData = await generateMealPlan(profile);

    const mealPlan = await MealPlan.create({
      user: req.user._id,
      healthProfile: profile._id,
      title: `7-Day DIETORA Plan — ${new Date().toLocaleDateString('en-PK')}`,
      ...planData,
    });

    // Populate food item details for response
    const populated = await MealPlan.findById(mealPlan._id).populate(
      'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem'
    );

    return successResponse(res, populated, '7-day meal plan generated successfully! 🎉', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/meal-plans
 * @desc    Get all meal plans for current user (paginated)
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [plans, total] = await Promise.all([
      MealPlan.find(filter)
        .select('-days') // exclude full days for list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MealPlan.countDocuments(filter),
    ]);

    return paginatedResponse(res, plans, total, page, limit, 'Meal plans fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/meal-plans/active
 * @desc    Get the current active meal plan
 * @access  Private
 */
const getActive = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ user: req.user._id, status: 'active' })
      .populate('days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active meal plan found. Generate one at POST /meal-plans/generate',
      });
    }

    return successResponse(res, plan, 'Active meal plan fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/meal-plans/:id
 * @desc    Get a specific meal plan by ID
 * @access  Private
 */
const getById = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id })
      .populate('days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Meal plan not found.' });
    }

    return successResponse(res, plan, 'Meal plan fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/meal-plans/:id/day/:dayNumber
 * @desc    Get a single day from a meal plan
 * @access  Private
 */
const getDayPlan = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id })
      .populate('days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Meal plan not found.' });
    }

    const day = plan.days.find((d) => d.day === parseInt(req.params.dayNumber));
    if (!day) {
      return res.status(404).json({ success: false, message: `Day ${req.params.dayNumber} not found.` });
    }

    return successResponse(res, day, `Day ${req.params.dayNumber} plan fetched`);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/meal-plans/:id
 * @desc    Archive (soft-delete) a meal plan
 * @access  Private
 */
const archivePlan = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'archived' },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Meal plan not found.' });
    }

    return successResponse(res, {}, 'Meal plan archived successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, getAll, getActive, getById, getDayPlan, archivePlan };
