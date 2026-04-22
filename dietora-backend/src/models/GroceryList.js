// src/models/GroceryList.js
// Auto-generated from a MealPlan

const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
    },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'serving' },
    estimatedPrice: { type: Number, default: 0 }, // PKR
    isPurchased: { type: Boolean, default: false },
    category: { type: String, default: 'general' },
  },
  { _id: true }
);

const groceryListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
    },
    title: {
      type: String,
      default: 'Weekly Grocery List',
    },
    items: [groceryItemSchema],
    totalEstimatedCost: {
      type: Number,
      default: 0, // PKR
    },
    totalPurchasedCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroceryList', groceryListSchema);
