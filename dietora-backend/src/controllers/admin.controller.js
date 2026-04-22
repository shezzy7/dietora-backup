// src/controllers/admin.controller.js

const User = require('../models/User');
const FoodItem = require('../models/FoodItem');
const MealPlan = require('../models/MealPlan');
const Feedback = require('../models/Feedback');
const HealthProfile = require('../models/HealthProfile');
const { successResponse, paginatedResponse } = require('../utils/response.utils');

// ═══════════════════════════════════════════════════════════
//  FOOD ITEM MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/admin/foods
 * @desc    Add a new food item
 * @access  Admin
 */
const createFood = async (req, res, next) => {
  try {
    const food = await FoodItem.create(req.body);
    return successResponse(res, food, 'Food item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/foods
 * @desc    Get all food items (with search & filter)
 * @access  Admin
 */
const getAllFoods = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.is_diabetic_safe) filter.is_diabetic_safe = req.query.is_diabetic_safe === 'true';
    if (req.query.is_hypertension_safe) filter.is_hypertension_safe = req.query.is_hypertension_safe === 'true';
    if (req.query.is_cardiac_safe) filter.is_cardiac_safe = req.query.is_cardiac_safe === 'true';
    if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable === 'true';
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [foods, total] = await Promise.all([
      FoodItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      FoodItem.countDocuments(filter),
    ]);

    return paginatedResponse(res, foods, total, page, limit, 'Food items fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/foods/:id
 * @desc    Get a single food item
 * @access  Admin
 */
const getFoodById = async (req, res, next) => {
  try {
    const food = await FoodItem.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found.' });
    return successResponse(res, food, 'Food item fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/admin/foods/:id
 * @desc    Update a food item
 * @access  Admin
 */
const updateFood = async (req, res, next) => {
  try {
    const food = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found.' });
    return successResponse(res, food, 'Food item updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/admin/foods/:id
 * @desc    Delete a food item (or mark unavailable)
 * @access  Admin
 */
const deleteFood = async (req, res, next) => {
  try {
    // Soft delete: mark unavailable
    const food = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false },
      { new: true }
    );
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found.' });
    return successResponse(res, {}, 'Food item removed from active database');
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with health profile info
 * @access  Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { role: 'user' };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(res, users, total, page, limit, 'Users fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get a single user with full details
 * @access  Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const profile = await HealthProfile.findOne({ user: user._id });
    const mealPlansCount = await MealPlan.countDocuments({ user: user._id });

    return successResponse(res, { user, profile, mealPlansCount }, 'User details fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/users/:id/toggle
 * @desc    Activate/deactivate a user account
 * @access  Admin
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return successResponse(
      res,
      { isActive: user.isActive },
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/admin/analytics
 * @desc    Get platform analytics summary
 * @access  Admin
 */
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalMealPlans,
      totalFoodItems,
      totalFeedback,
      avgRating,
      diabeticUsers,
      hypertensiveUsers,
      cardiacUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      MealPlan.countDocuments(),
      FoodItem.countDocuments({ isAvailable: true }),
      Feedback.countDocuments(),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      HealthProfile.countDocuments({ isDiabetic: true }),
      HealthProfile.countDocuments({ isHypertensive: true }),
      HealthProfile.countDocuments({ isCardiac: true }),
    ]);

    return successResponse(
      res,
      {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        mealPlans: { total: totalMealPlans },
        foodItems: { total: totalFoodItems },
        feedback: {
          total: totalFeedback,
          avgRating: parseFloat((avgRating[0]?.avg || 0).toFixed(1)),
        },
        healthConditions: {
          diabetic: diabeticUsers,
          hypertensive: hypertensiveUsers,
          cardiac: cardiacUsers,
        },
      },
      'Analytics fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFood, getAllFoods, getFoodById, updateFood, deleteFood,
  getAllUsers, getUserById, toggleUserStatus,
  getAnalytics,
};
