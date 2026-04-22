// src/models/MealPlan.js
// 7-day AI-generated meal plan

const mongoose = require('mongoose');

// Sub-schema: a single meal slot
const mealSlotSchema = new mongoose.Schema(
  {
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    price: Number, // PKR
  },
  { _id: false }
);

// Sub-schema: one day's meals
const dayPlanSchema = new mongoose.Schema(
  {
    day: {
      type: Number, // 1-7
      required: true,
    },
    dayName: {
      type: String, // 'Monday', 'Tuesday', etc.
    },
    breakfast: [mealSlotSchema],
    lunch: [mealSlotSchema],
    dinner: [mealSlotSchema],
    snack: [mealSlotSchema],
    // Totals for the day
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }, // PKR
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    healthProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthProfile',
    },
    title: {
      type: String,
      default: '7-Day DIETORA Meal Plan',
    },
    // Plan configuration snapshot (at time of generation)
    planConfig: {
      dailyCalorieTarget: Number,
      dailyBudget: Number, // PKR
      goal: String,
      isDiabetic: Boolean,
      isHypertensive: Boolean,
      isCardiac: Boolean,
      allergies: [String],
    },
    days: [dayPlanSchema], // 7 days
    // Weekly summary
    weeklyTotalCalories: { type: Number, default: 0 },
    weeklyTotalCost: { type: Number, default: 0 }, // PKR
    avgDailyCalories: { type: Number, default: 0 },
    avgDailyCost: { type: Number, default: 0 }, // PKR
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isAIGenerated: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-set endDate (startDate + 7 days)
mealPlanSchema.pre('save', function (next) {
  if (this.startDate && !this.endDate) {
    this.endDate = new Date(this.startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('MealPlan', mealPlanSchema);
