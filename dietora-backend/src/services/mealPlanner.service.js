// src/services/mealPlanner.service.js
// Core AI Meal Planning Logic for DIETORA
// Pipeline: fetchConstraints → filterAllergens → diseaseFilter → optimizeBudget → buildPlan

const FoodItem = require('../models/FoodItem');

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * STEP 1 — fetchConstraints
 * Extract all planning parameters from the user's health profile
 */
const fetchConstraints = (healthProfile) => {
  return {
    dailyCalorieTarget: healthProfile.dailyCalorieTarget,
    dailyBudget: healthProfile.dailyBudget, // PKR
    isDiabetic: healthProfile.isDiabetic,
    isHypertensive: healthProfile.isHypertensive,
    isCardiac: healthProfile.isCardiac,
    allergies: healthProfile.allergies || [],
    goal: healthProfile.goal,
    // Macronutrient targets based on goal
    proteinTarget: calculateProteinTarget(healthProfile),
    carbTarget: calculateCarbTarget(healthProfile),
    fatTarget: calculateFatTarget(healthProfile),
  };
};

/**
 * STEP 2 — fetchAvailableFoods
 * Get all available food items from DB
 */
const fetchAvailableFoods = async () => {
  return FoodItem.find({ isAvailable: true }).lean();
};

/**
 * STEP 3 — filterAllergens
 * Remove foods that contain user's allergens
 */
const filterAllergens = (foods, allergies) => {
  if (!allergies || allergies.length === 0) return foods;
  return foods.filter((food) => {
    return !food.allergens.some((allergen) =>
      allergies.map((a) => a.toLowerCase()).includes(allergen.toLowerCase())
    );
  });
};

/**
 * STEP 4 — filterByDiseases
 * Apply disease-based filtering
 */
const filterByDiseases = (foods, constraints) => {
  return foods.filter((food) => {
    if (constraints.isDiabetic && !food.is_diabetic_safe) return false;
    if (constraints.isHypertensive && !food.is_hypertension_safe) return false;
    if (constraints.isCardiac && !food.is_cardiac_safe) return false;
    return true;
  });
};

/**
 * STEP 5 — groupByMealType
 * Group filtered foods by their meal types for easy selection
 */
const groupByMealType = (foods) => {
  const groups = { breakfast: [], lunch: [], dinner: [], snack: [] };
  foods.forEach((food) => {
    (food.mealType || []).forEach((type) => {
      if (groups[type]) groups[type].push(food);
    });
  });
  return groups;
};

/**
 * STEP 6 — optimizeBudget
 * Select foods that fit within the daily budget
 * Uses a greedy approach — prioritizes nutritional balance, then cost
 */
const optimizeBudget = (mealGroups, constraints) => {
  const budgetPerMeal = {
    breakfast: constraints.dailyBudget * 0.25,
    lunch: constraints.dailyBudget * 0.35,
    dinner: constraints.dailyBudget * 0.30,
    snack: constraints.dailyBudget * 0.10,
  };

  const optimized = {};

  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
    const candidates = mealGroups[mealType] || [];
    // Sort by best calorie-per-PKR ratio (value for money)
    const sorted = [...candidates].sort((a, b) => {
      const ratioA = a.calories / (a.price || 1);
      const ratioB = b.calories / (b.price || 1);
      return ratioB - ratioA;
    });
    // Filter foods within budget for this meal
    optimized[mealType] = sorted.filter((food) => food.price <= budgetPerMeal[mealType]);
    // Fallback: if no food within budget, take cheapest available
    if (optimized[mealType].length === 0 && sorted.length > 0) {
      optimized[mealType] = [sorted[sorted.length - 1]];
    }
  }

  return optimized;
};

/**
 * STEP 7 — selectMeal
 * Randomly pick a food item from candidates, with variety tracking
 */
const selectMeal = (candidates, usedIds, maxRetries = 5) => {
  if (!candidates || candidates.length === 0) return null;

  let food = null;
  let attempts = 0;

  // Try to find an unused food (for variety)
  while (attempts < maxRetries) {
    const idx = Math.floor(Math.random() * candidates.length);
    const candidate = candidates[idx];
    if (!usedIds.has(candidate._id.toString())) {
      food = candidate;
      usedIds.add(candidate._id.toString());
      break;
    }
    attempts++;
  }

  // If all are used, just pick randomly (reset variety after full cycle)
  if (!food) {
    food = candidates[Math.floor(Math.random() * candidates.length)];
  }

  return food;
};

/**
 * buildMealSlot — format a food item into a meal slot object
 */
const buildMealSlot = (food, quantity = 1) => {
  if (!food) return null;
  return {
    foodItem: food._id,
    quantity,
    calories: Math.round(food.calories * quantity),
    protein: parseFloat((food.protein * quantity).toFixed(1)),
    carbs: parseFloat((food.carbs * quantity).toFixed(1)),
    fat: parseFloat((food.fat * quantity).toFixed(1)),
    price: parseFloat((food.price * quantity).toFixed(2)),
  };
};

/**
 * STEP 8 — generate7DayPlan
 * Build the complete 7-day meal plan
 */
const generate7DayPlan = (optimizedGroups, constraints) => {
  const days = [];
  const usedBreakfast = new Set();
  const usedLunch = new Set();
  const usedDinner = new Set();
  const usedSnack = new Set();

  for (let i = 0; i < 7; i++) {
    const bfFood = selectMeal(optimizedGroups.breakfast, usedBreakfast);
    const lunchFood = selectMeal(optimizedGroups.lunch, usedLunch);
    const dinnerFood = selectMeal(optimizedGroups.dinner, usedDinner);
    const snackFood = selectMeal(optimizedGroups.snack, usedSnack);

    const breakfast = bfFood ? [buildMealSlot(bfFood)] : [];
    const lunch = lunchFood ? [buildMealSlot(lunchFood)] : [];
    const dinner = dinnerFood ? [buildMealSlot(dinnerFood)] : [];
    const snack = snackFood ? [buildMealSlot(snackFood)] : [];

    // Calculate day totals
    const allSlots = [...breakfast, ...lunch, ...dinner, ...snack].filter(Boolean);
    const totalCalories = allSlots.reduce((s, m) => s + (m.calories || 0), 0);
    const totalProtein = allSlots.reduce((s, m) => s + (m.protein || 0), 0);
    const totalCarbs = allSlots.reduce((s, m) => s + (m.carbs || 0), 0);
    const totalFat = allSlots.reduce((s, m) => s + (m.fat || 0), 0);
    const totalCost = allSlots.reduce((s, m) => s + (m.price || 0), 0);

    days.push({
      day: i + 1,
      dayName: DAY_NAMES[i],
      breakfast,
      lunch,
      dinner,
      snack,
      totalCalories: Math.round(totalCalories),
      totalProtein: parseFloat(totalProtein.toFixed(1)),
      totalCarbs: parseFloat(totalCarbs.toFixed(1)),
      totalFat: parseFloat(totalFat.toFixed(1)),
      totalCost: parseFloat(totalCost.toFixed(2)),
    });
  }

  return days;
};

/**
 * MAIN EXPORT — generateMealPlan
 * Full pipeline: constraints → filter → optimize → generate
 */
const generateMealPlan = async (healthProfile) => {
  // Step 1: Get constraints
  const constraints = fetchConstraints(healthProfile);

  // Step 2: Fetch all foods
  let foods = await fetchAvailableFoods();

  if (foods.length === 0) {
    throw new Error('No food items found in database. Please seed the database first.');
  }

  // Step 3: Filter allergens
  foods = filterAllergens(foods, constraints.allergies);

  // Step 4: Filter by diseases
  foods = filterByDiseases(foods, constraints);

  if (foods.length < 4) {
    throw new Error(
      'Not enough suitable food items found for your health conditions. Please contact admin.'
    );
  }

  // Step 5: Group by meal type
  const mealGroups = groupByMealType(foods);

  // Step 6: Optimize for budget
  const optimizedGroups = optimizeBudget(mealGroups, constraints);

  // Step 7: Generate 7-day plan
  const days = generate7DayPlan(optimizedGroups, constraints);

  // Step 8: Calculate weekly summaries
  const weeklyTotalCalories = days.reduce((s, d) => s + d.totalCalories, 0);
  const weeklyTotalCost = days.reduce((s, d) => s + d.totalCost, 0);

  return {
    days,
    planConfig: {
      dailyCalorieTarget: constraints.dailyCalorieTarget,
      dailyBudget: constraints.dailyBudget,
      goal: constraints.goal,
      isDiabetic: constraints.isDiabetic,
      isHypertensive: constraints.isHypertensive,
      isCardiac: constraints.isCardiac,
      allergies: constraints.allergies,
    },
    weeklyTotalCalories: Math.round(weeklyTotalCalories),
    weeklyTotalCost: parseFloat(weeklyTotalCost.toFixed(2)),
    avgDailyCalories: Math.round(weeklyTotalCalories / 7),
    avgDailyCost: parseFloat((weeklyTotalCost / 7).toFixed(2)),
  };
};

// ─── Macro Helpers ────────────────────────────────────────

const calculateProteinTarget = (hp) => {
  // High protein for weight loss/gain: 1.6-2.0g/kg; maintenance: 0.8g/kg
  const factor = hp.goal === 'maintenance' ? 0.8 : 1.8;
  return Math.round(hp.weight * factor);
};

const calculateCarbTarget = (hp) => {
  // 45-65% of calories from carbs; lower for diabetic
  const pct = hp.isDiabetic ? 0.40 : 0.50;
  return Math.round((hp.dailyCalorieTarget * pct) / 4); // 4 kcal/g
};

const calculateFatTarget = (hp) => {
  // 20-35% of calories from fat
  const pct = hp.isCardiac ? 0.20 : 0.30;
  return Math.round((hp.dailyCalorieTarget * pct) / 9); // 9 kcal/g
};

module.exports = { generateMealPlan, fetchConstraints };
