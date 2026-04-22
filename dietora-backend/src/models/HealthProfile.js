// src/models/HealthProfile.js
// 1:1 relationship with User — stores health & dietary info

const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // enforces 1:1
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [5, 'Age must be at least 5'],
      max: [120, 'Age must be less than 120'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Gender is required'],
    },
    weight: {
      type: Number, // kg
      required: [true, 'Weight is required'],
      min: [10, 'Weight must be at least 10 kg'],
      max: [300, 'Weight must be less than 300 kg'],
    },
    height: {
      type: Number, // cm
      required: [true, 'Height is required'],
      min: [50, 'Height must be at least 50 cm'],
      max: [250, 'Height must be less than 250 cm'],
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      required: [true, 'Activity level is required'],
    },
    goal: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'maintenance'],
      required: [true, 'Goal is required'],
    },
    // ─── Disease Flags ──────────────────────────────────
    isDiabetic: { type: Boolean, default: false },
    isHypertensive: { type: Boolean, default: false },
    isCardiac: { type: Boolean, default: false },

    // ─── Allergies ──────────────────────────────────────
    allergies: {
      type: [String],
      default: [],
      // e.g. ['nuts', 'dairy', 'gluten']
    },

    // ─── Budget ─────────────────────────────────────────
    dailyBudget: {
      type: Number, // PKR
      required: [true, 'Daily budget is required'],
      min: [100, 'Daily budget must be at least PKR 100'],
    },

    // ─── Auto-calculated fields ─────────────────────────
    bmi: {
      type: Number,
    },
    bmiCategory: {
      type: String,
      enum: ['Underweight', 'Normal', 'Overweight', 'Obese', ''],
      default: '',
    },
    bmr: {
      type: Number, // Basal Metabolic Rate (kcal/day)
    },
    tdee: {
      type: Number, // Total Daily Energy Expenditure (kcal/day)
    },
    dailyCalorieTarget: {
      type: Number, // adjusted for goal
    },
  },
  { timestamps: true }
);

// ─── Pre-save: Auto-calculate BMI, BMR, TDEE ─────────────
healthProfileSchema.pre('save', function (next) {
  // BMI = weight(kg) / height(m)^2
  const heightInMeters = this.height / 100;
  this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));

  // BMI Category
  if (this.bmi < 18.5) this.bmiCategory = 'Underweight';
  else if (this.bmi < 25) this.bmiCategory = 'Normal';
  else if (this.bmi < 30) this.bmiCategory = 'Overweight';
  else this.bmiCategory = 'Obese';

  // ─── Mifflin-St Jeor BMR Formula (Objective 1.5.1) ──
  // Male:   BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5
  // Female: BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161
  if (this.gender === 'male') {
    this.bmr = Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age + 5);
  } else {
    this.bmr = Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age - 161);
  }

  // ─── TDEE = BMR × Activity Multiplier ───────────────
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  this.tdee = Math.round(this.bmr * activityMultipliers[this.activityLevel]);

  // ─── Daily Calorie Target based on Goal ─────────────
  if (this.goal === 'weight_loss') {
    this.dailyCalorieTarget = Math.round(this.tdee - 500); // 500 kcal deficit
  } else if (this.goal === 'weight_gain') {
    this.dailyCalorieTarget = Math.round(this.tdee + 500); // 500 kcal surplus
  } else {
    this.dailyCalorieTarget = this.tdee; // maintenance
  }

  next();
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
