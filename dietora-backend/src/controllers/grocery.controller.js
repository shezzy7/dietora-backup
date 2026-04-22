// src/controllers/grocery.controller.js

const GroceryList = require('../models/GroceryList');
const MealPlan = require('../models/MealPlan');
const { generateGroceryList } = require('../services/grocery.service');
const { successResponse } = require('../utils/response.utils');

/**
 * @route   POST /api/v1/grocery-list/generate/:mealPlanId
 * @desc    Auto-generate grocery list from a meal plan
 * @access  Private
 */
const generate = async (req, res, next) => {
  try {
    const groceryList = await generateGroceryList(req.params.mealPlanId, req.user._id);
    return successResponse(res, groceryList, 'Grocery list generated successfully! 🛒', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/grocery-list
 * @desc    Get current user's latest grocery list
 * @access  Private
 */
const getMyList = async (req, res, next) => {
  try {
    const list = await GroceryList.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('mealPlan', 'title startDate endDate');

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'No grocery list found. Generate one from your meal plan.',
      });
    }

    return successResponse(res, list, 'Grocery list fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/grocery-list/:id
 * @desc    Get a specific grocery list
 * @access  Private
 */
const getById = async (req, res, next) => {
  try {
    const list = await GroceryList.findOne({ _id: req.params.id, user: req.user._id })
      .populate('mealPlan', 'title');

    if (!list) {
      return res.status(404).json({ success: false, message: 'Grocery list not found.' });
    }

    return successResponse(res, list, 'Grocery list fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/grocery-list/:id/item/:itemId/toggle
 * @desc    Toggle isPurchased on a grocery item
 * @access  Private
 */
const toggleItem = async (req, res, next) => {
  try {
    const list = await GroceryList.findOne({ _id: req.params.id, user: req.user._id });
    if (!list) {
      return res.status(404).json({ success: false, message: 'Grocery list not found.' });
    }

    const item = list.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in grocery list.' });
    }

    item.isPurchased = !item.isPurchased;

    // Update status
    const allPurchased = list.items.every((i) => i.isPurchased);
    const anyPurchased = list.items.some((i) => i.isPurchased);
    list.status = allPurchased ? 'completed' : anyPurchased ? 'partial' : 'pending';

    // Recalculate purchased cost
    list.totalPurchasedCost = parseFloat(
      list.items
        .filter((i) => i.isPurchased)
        .reduce((s, i) => s + i.estimatedPrice, 0)
        .toFixed(2)
    );

    await list.save();
    return successResponse(res, list, 'Item updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/grocery-list/:id
 * @desc    Delete a grocery list
 * @access  Private
 */
const deleteList = async (req, res, next) => {
  try {
    const list = await GroceryList.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!list) {
      return res.status(404).json({ success: false, message: 'Grocery list not found.' });
    }
    return successResponse(res, {}, 'Grocery list deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, getMyList, getById, toggleItem, deleteList };
