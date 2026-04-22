// Utility: BMI calculation
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null
  const h = heightCm / 100
  return parseFloat((weightKg / (h * h)).toFixed(1))
}

// Utility: BMI status
export function getBMIStatus(bmi) {
  if (!bmi) return { label: 'N/A', color: 'slate', desc: 'Enter weight and height' }
  if (bmi < 18.5) return { label: 'Underweight', color: 'blue', desc: 'Below healthy range' }
  if (bmi < 25) return { label: 'Normal', color: 'emerald', desc: 'Healthy weight range' }
  if (bmi < 30) return { label: 'Overweight', color: 'amber', desc: 'Above healthy range' }
  return { label: 'Obese', color: 'red', desc: 'Significantly above range' }
}

// Utility: BMR using Mifflin-St Jeor
export function calculateBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'female' ? base - 161 : base + 5
}

// Utility: TDEE
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

export function calculateTDEE(bmr, activityLevel) {
  if (!bmr) return null
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55
  return Math.round(bmr * multiplier)
}

// Utility: Greet based on time
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Utility: Format PKR currency
export function formatPKR(amount) {
  return `₨${Number(amount).toLocaleString('en-PK')}`
}

// Utility: Truncate text
export function truncate(text, maxLength = 80) {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// Utility: Format date in Pakistani style
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Utility: Capitalize first letter
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Utility: Get nutrition percentage (for progress bars)
export function getNutritionPct(value, target) {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((value / target) * 100))
}

// Utility: Color class helper for stats
export function getColorClass(color, type = 'text') {
  const map = {
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-500' },
    amber:   { text: 'text-amber-600',   bg: 'bg-amber-100 dark:bg-amber-900/30',   border: 'border-amber-500' },
    blue:    { text: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900/30',    border: 'border-blue-500' },
    red:     { text: 'text-red-600',     bg: 'bg-red-100 dark:bg-red-900/30',      border: 'border-red-500' },
    purple:  { text: 'text-purple-600',  bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-500' },
    slate:   { text: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-700',     border: 'border-slate-500' },
  }
  return map[color]?.[type] || map.slate[type]
}
