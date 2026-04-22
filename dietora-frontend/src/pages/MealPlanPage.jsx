import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { generateMealPlan, fetchMealPlans, fetchActivePlan, setSelectedDay } from '../store/slices/mealPlanSlice'
import { fetchProfile } from '../store/slices/profileSlice'
import { Link } from 'react-router-dom'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

function MealCard({ mealType, meal }) {
  if (!meal) return (
    <div className="meal-card opacity-40">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{MEAL_ICONS[mealType]}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider capitalize">{mealType}</span>
      </div>
      <p className="text-slate-300 dark:text-slate-600 text-sm italic">No meal assigned</p>
    </div>
  )
  return (
    <div className="meal-card group hover:scale-[1.01] transition-transform duration-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{MEAL_ICONS[mealType]}</span>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider capitalize">{mealType}</span>
      </div>
      <h4 className="font-display font-bold text-slate-800 dark:text-white text-sm mb-1 leading-tight">{meal.name}</h4>
      {meal.category && <p className="text-xs text-slate-400 mb-3 capitalize">{meal.category}</p>}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-emerald-600">{meal.calories}</p>
          <p className="text-[10px] text-slate-400">kcal</p>
        </div>
        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-blue-600">{meal.protein}g</p>
          <p className="text-[10px] text-slate-400">protein</p>
        </div>
        <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg py-1.5">
          <p className="text-xs font-bold text-amber-600">₨{meal.price}</p>
          <p className="text-[10px] text-slate-400">cost</p>
        </div>
      </div>
      {(meal.is_diabetic_safe || meal.is_hypertension_safe || meal.is_cardiac_safe) && (
        <div className="mt-2.5 flex gap-1 flex-wrap">
          {meal.is_diabetic_safe && <span className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px]">🩸 Diabetic Safe</span>}
          {meal.is_hypertension_safe && <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px]">❤️ BP Safe</span>}
          {meal.is_cardiac_safe && <span className="badge bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-[10px]">🫀 Cardiac Safe</span>}
        </div>
      )}
    </div>
  )
}

function DayNutritionSummary({ day }) {
  if (!day?.meals) return null
  const vals = Object.values(day.meals)
  const totals = {
    cal: vals.reduce((s, m) => s + (m?.calories || 0), 0),
    prot: vals.reduce((s, m) => s + (m?.protein || 0), 0),
    carbs: vals.reduce((s, m) => s + (m?.carbs || 0), 0),
    fat: vals.reduce((s, m) => s + (m?.fat || 0), 0),
    cost: vals.reduce((s, m) => s + (m?.price || 0), 0),
  }
  return (
    <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-slate-700 dark:text-white text-sm">📊 Day {day.day} Nutrition Summary</h3>
        <span className="badge-emerald text-xs">{day.dayName}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Calories', value: `${totals.cal}`, unit: 'kcal', color: 'text-emerald-600' },
          { label: 'Protein', value: `${totals.prot}g`, color: 'text-blue-600' },
          { label: 'Carbs', value: `${totals.carbs}g`, color: 'text-orange-500' },
          { label: 'Fat', value: `${totals.fat}g`, color: 'text-purple-600' },
          { label: 'Cost', value: `₨${totals.cost}`, color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className={`font-display font-bold text-lg leading-tight ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function GeneratingOverlay() {
  const [step, setStep] = useState(0)
  const steps = [
    '🏥 Checking your health conditions...',
    '🌾 Filtering safe Pakistani foods...',
    '💰 Optimizing for your budget...',
    '📅 Building your 7-day plan...',
    '✅ Almost done...',
  ]
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % steps.length), 600)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-slide-up">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-5" />
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">Generating Your Plan</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 transition-all duration-300">{steps[step]}</p>
        <div className="flex gap-1 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
              style={{ width: i <= step ? '24px' : '8px' }} />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">Usually takes 1–2 seconds</p>
      </div>
    </div>
  )
}

export default function MealPlanPage() {
  const dispatch = useDispatch()
  const { current, list, generating, selectedDay, error } = useSelector((s) => s.mealPlan)
  const { data: profile } = useSelector((s) => s.profile)
  const [showGenerator, setShowGenerator] = useState(false)
  const [budgetOverride, setBudgetOverride] = useState('')

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchMealPlans())
    dispatch(fetchActivePlan())
  }, [dispatch])

  const activePlan = current || list?.[0]

  const handleGenerate = () => {
    const params = {}
    if (budgetOverride && parseInt(budgetOverride) >= 100) {
      params.budgetLimit = parseInt(budgetOverride)
    }
    dispatch(generateMealPlan(params))
    setShowGenerator(false)
    setBudgetOverride('')
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-6xl mb-4">🏥</div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">Setup your health profile first</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">We need your health info, conditions, and budget to generate a safe, personalized plan.</p>
        <Link to="/profile" className="btn-primary py-3 px-8 inline-block">Setup Health Profile →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overlay while generating */}
      {generating && <GeneratingOverlay />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">AI Meal Planner</h1>
          <p className="page-subtitle">Personalized 7-day plans for your health conditions & budget</p>
        </div>
        <button onClick={() => setShowGenerator(true)} disabled={generating}
          className="btn-primary flex items-center gap-2 flex-shrink-0">
          🤖 Generate New Plan
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">Generate 7-Day Plan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Your health profile settings will be applied automatically</p>
            {/* Profile summary */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p>🏥 Conditions: {[profile.isDiabetic && 'Diabetes', profile.isHypertensive && 'Hypertension', profile.isCardiac && 'Cardiac'].filter(Boolean).join(', ') || 'None'}</p>
              <p>⚠️ Allergies: {profile.allergies?.join(', ') || 'None'}</p>
              <p>🔥 Daily target: ~{Math.round(profile.dailyCalorieTarget || profile.tdee || 2000)} kcal</p>
              <p>💰 Default budget: ₨{profile.dailyBudget}/day</p>
            </div>
            <div className="mb-5">
              <label className="label">Budget Override (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₨</span>
                <input type="number" placeholder={`Default: ₨${profile.dailyBudget}`}
                  value={budgetOverride} onChange={(e) => setBudgetOverride(e.target.value)}
                  className="input-field pl-8" min="100" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenerator(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleGenerate} className="btn-primary flex-1">🤖 Generate Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Plan View */}
      {activePlan ? (
        <>
          {/* Plan Info Bar */}
          <div className="card flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-xl">🗓️</div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">7-Day Meal Plan</p>
                <p className="text-xs text-slate-400">
                  Generated {new Date(activePlan.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <p className="font-bold text-emerald-600 text-sm">₨{activePlan.totalCost}</p>
                <p className="text-xs text-slate-400">Weekly Cost</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-amber-600 text-sm">{Math.round((activePlan.totalCalories || 0) / 7)}</p>
                <p className="text-xs text-slate-400">Avg kcal/day</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-blue-600 text-sm">₨{Math.round((activePlan.totalCost || 0) / 7)}</p>
                <p className="text-xs text-slate-400">Per Day</p>
              </div>
            </div>
            <Link to="/grocery" className="btn-amber py-2 px-4 text-sm flex-shrink-0">🛒 Grocery List</Link>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {DAYS.map((day, i) => (
              <button key={day} onClick={() => dispatch(setSelectedDay(i))}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 snap-start ${
                  selectedDay === i
                    ? 'bg-emerald-600 text-white shadow-glow'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}>
                <span className="block font-bold">{day.slice(0, 3)}</span>
                <span className="block text-[10px] opacity-70">Day {i + 1}</span>
              </button>
            ))}
          </div>

          {/* Day Summary */}
          {activePlan.days?.[selectedDay] && (
            <DayNutritionSummary day={activePlan.days[selectedDay]} />
          )}

          {/* Meal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_ORDER.map((mealType) => (
              <MealCard key={mealType} mealType={mealType}
                meal={activePlan.days?.[selectedDay]?.meals?.[mealType]} />
            ))}
          </div>

          {/* Past Plans */}
          {list.length > 1 && (
            <div className="card">
              <h3 className="font-display font-bold text-slate-800 dark:text-white mb-4 text-sm">📋 Past Meal Plans</h3>
              <div className="space-y-2">
                {list.slice(1, 6).map((plan, i) => (
                  <div key={plan._id || i}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">7-Day Plan #{list.length - i - 1}</p>
                      <p className="text-xs text-slate-400">{new Date(plan.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-amber-600 font-semibold">₨{plan.totalCost}</span>
                      <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500">Archived</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <p className="text-6xl mb-4">🍽️</p>
          <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">No meal plans yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-sm mx-auto">
            Click "Generate New Plan" to create your first AI-powered 7-day Pakistani meal plan.
          </p>
          <button onClick={() => setShowGenerator(true)} className="btn-primary py-3 px-8">
            🤖 Generate My First Plan
          </button>
        </div>
      )}
    </div>
  )
}
