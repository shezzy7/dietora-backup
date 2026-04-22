// src/validators/food.validator.js
const { z } = require('zod');

const foodSchema = z.object({
  name: z.string().min(1).max(100),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).default(0),
  price: z.number().min(0),
  servingSize: z.string().default('1 serving'),
  is_diabetic_safe: z.boolean().default(false),
  is_hypertension_safe: z.boolean().default(false),
  is_cardiac_safe: z.boolean().default(false),
  category: z.enum([
    'breakfast', 'lunch', 'dinner', 'snack', 'bread',
    'rice', 'lentils', 'meat', 'vegetable', 'dairy',
    'beverage', 'fruit', 'dessert',
  ]),
  mealType: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])).default(['lunch', 'dinner']),
  allergens: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  description: z.string().max(500).default(''),
});

const updateFoodSchema = foodSchema.partial();

module.exports = { foodSchema, updateFoodSchema };
