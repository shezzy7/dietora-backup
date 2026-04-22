// src/services/grocery.service.js
// Auto-generate grocery list from a meal plan

const GroceryList = require('../models/GroceryList');
const MealPlan = require('../models/MealPlan');
const FoodItem = require('../models/FoodItem');

/**
 * generateGroceryList
 * Aggregates all food items across 7 days of a meal plan
 * Groups by food item and sums quantity + cost
 */
const generateGroceryList = async (mealPlanId, userId) => {
  // Populate food items in the meal plan
  const mealPlan = await MealPlan.findById(mealPlanId).populate({
    path: 'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem',
    model: 'FoodItem',
  });

  if (!mealPlan) throw new Error('Meal plan not found');
  if (mealPlan.user.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to meal plan');
  }

  const itemMap = new Map(); // foodItemId → aggregated data

  for (const day of mealPlan.days) {
    const allMeals = [
      ...day.breakfast,
      ...day.lunch,
      ...day.dinner,
      ...day.snack,
    ];

    for (const meal of allMeals) {
      if (!meal.foodItem) continue;
      const food = meal.foodItem;
      const id = food._id.toString();

      if (itemMap.has(id)) {
        const existing = itemMap.get(id);
        existing.quantity += meal.quantity || 1;
        existing.estimatedPrice += meal.price || food.price;
      } else {
        itemMap.set(id, {
          foodItem: food._id,
          name: food.name,
          quantity: meal.quantity || 1,
          unit: food.servingSize || 'serving',
          estimatedPrice: meal.price || food.price,
          category: food.category,
          isPurchased: false,
        });
      }
    }
  }

  const items = Array.from(itemMap.values());
  const totalEstimatedCost = parseFloat(
    items.reduce((s, i) => s + i.estimatedPrice, 0).toFixed(2)
  );

  // Remove old grocery list for this plan, create new one
  await GroceryList.findOneAndDelete({ mealPlan: mealPlanId, user: userId });

  const groceryList = await GroceryList.create({
    user: userId,
    mealPlan: mealPlanId,
    title: `Grocery List — ${mealPlan.title}`,
    items,
    totalEstimatedCost,
    status: 'pending',
  });

  return groceryList;
};

module.exports = { generateGroceryList };
