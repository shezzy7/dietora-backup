import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, saveProfile } from '../store/slices/profileSlice'
import toast from 'react-hot-toast'

const DISEASES = [
  { key: 'isDiabetic', label: 'Diabetes', icon: '🩸', color: 'blue' },
  { key: 'isHypertensive', label: 'Hypertension', icon: '❤️', color: 'red' },
  { key: 'isCardiac', label: 'Cardiac', icon: '🫀', color: 'purple' },
]
const ALLERGIES = ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy']
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little/no exercise', icon: '🛋️' },
  { value: 'lightly_active', label: 'Lightly Active', desc: '1-3 days/week', icon: '🚶' },
  { value: 'moderately_active', label: 'Moderately Active', desc: '3-5 days/week', icon: '🏃' },
  { value: 'very_active', label: 'Very Active', desc: '6-7 days/week', icon: '🏋️' },
  { value: 'extra_active', label: 'Extra Active', desc: 'Physical job + training', icon: '⚡' },
]
const GOALS = [
  { value: 'weight_loss', label: 'Lose Weight', icon: '📉', desc: '500 kcal deficit/day' },
  { value: 'maintenance', label: 'Maintain Weight', icon: '⚖️', desc: 'Eat at TDEE' },
  { value: 'weight_gain', label: 'Gain Weight', icon: '📈', desc: '500 kcal surplus/day' },
]

function BmiMeter({ bmi }) {
  if (!bmi) return null
  const clampedBmi = Math.min(Math.max(bmi, 10), 45)
  const pct = ((clampedBmi - 10) / 35) * 100
  const getColor = () => {
    if (bmi < 18.5) return '#3b82f6'
    if (bmi < 25) return '#10b981'
    if (bmi < 30) return '#f59e0b'
    return '#ef4444'
  }
  const getLabel = () => {
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25) return 'Normal Weight ✓'
    if (bmi < 30) return 'Overweight'
    return 'Obese'
  }
  return (
    <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          BMI: <span style={{ color: getColor() }} className="font-bold text-base">{bmi.toFixed(1)}</span>
        </span>
        <span className="text-sm font-bold" style={{ color: getColor() }}>{getLabel()}</span>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: getColor() }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
        <span>Underweight (&lt;18.5)</span>
        <span>Normal (18.5–24.9)</span>
        <span>Over (25–29.9)</span>
        <span>Obese (30+)</span>
      </div>
    </div>
  )
}

export default function HealthProfilePage() {
  const dispatch = useDispatch()
  const { data: profile, loading, saving } = useSelector((s) => s.profile)

  const defaultForm = {
    age: '', weight: '', height: '', gender: 'male',
    activityLevel: 'moderately_active', goal: 'maintenance',
    isDiabetic: false, isHypertensive: false, isCardiac: false,
    allergies: [], dailyBudget: '',
  }

  const [form, setForm] = useState(defaultForm)
  const [bmi, setBmi] = useState(null)

  useEffect(() => { dispatch(fetchProfile()) }, [dispatch])

  useEffect(() => {
    if (profile) {
      setForm({
        age: profile.age || '',
        weight: profile.weight || '',
        height: profile.height || '',
        gender: profile.gender || 'male',
        activityLevel: profile.activityLevel || 'moderately_active',
        goal: profile.goal || 'maintenance',
        isDiabetic: profile.isDiabetic || false,
        isHypertensive: profile.isHypertensive || false,
        isCardiac: profile.isCardiac || false,
        allergies: profile.allergies || [],
        dailyBudget: profile.dailyBudget || '',
      })
      setBmi(profile.bmi || null)
    }
  }, [profile])

  // Live BMI calculation
  useEffect(() => {
    const w = parseFloat(form.weight)
    const h = parseFloat(form.height)
    if (w > 0 && h > 0) {
      const hm = h / 100
      setBmi(parseFloat((w / (hm * hm)).toFixed(1)))
    } else {
      setBmi(null)
    }
  }, [form.weight, form.height])

  const toggleAllergy = (a) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(a)
        ? prev.allergies.filter((x) => x !== a)
        : [...prev.allergies, a],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.age || !form.weight || !form.height) {
      toast.error('Please fill in age, weight, and height')
      return
    }
    if (!form.dailyBudget || parseInt(form.dailyBudget) < 100) {
      toast.error('Daily budget must be at least ₨100')
      return
    }
    dispatch(saveProfile({
      age: parseInt(form.age),
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      gender: form.gender,
      activityLevel: form.activityLevel,
      goal: form.goal,
      isDiabetic: form.isDiabetic,
      isHypertensive: form.isHypertensive,
      isCardiac: form.isCardiac,
      allergies: form.allergies,
      dailyBudget: parseInt(form.dailyBudget),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-8">
      <div className="page-header">
        <h1 className="page-title">Health Profile</h1>
        <p className="page-subtitle">
          {profile ? 'Update your health info — BMI, BMR & TDEE recalculate automatically' : 'Set up your profile to get personalized AI meal plans'}
        </p>
      </div>

      {/* Auto-calc notice */}
      <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚡</span>
        <div className="text-sm text-emerald-700 dark:text-emerald-400">
          <strong>Auto-calculated:</strong> BMI, BMR (Mifflin-St Jeor), TDEE, and daily calorie targets are computed automatically on the backend when you save.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-base">
            <span className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-sm">👤</span>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Age (years)</label>
              <input type="number" min="5" max="120" value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="e.g. 30" className="input-field" required />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" min="10" max="300" step="0.1" value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="e.g. 70" className="input-field" required />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" min="50" max="250" value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="e.g. 170" className="input-field" required />
            </div>
          </div>
          <BmiMeter bmi={bmi} />
        </div>

        {/* Goal */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
            <span className="w-7 h-7 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-sm">🎯</span>
            Your Goal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GOALS.map((g) => (
              <button key={g.value} type="button" onClick={() => setForm({ ...form, goal: g.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                  form.goal === g.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300'
                }`}>
                <span className="text-2xl block mb-2">{g.icon}</span>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{g.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
            <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-sm">🏃</span>
            Activity Level
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIVITY_LEVELS.map((level) => (
              <button key={level.value} type="button" onClick={() => setForm({ ...form, activityLevel: level.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                  form.activityLevel === level.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-emerald-300'
                }`}>
                <span className="text-xl block mb-1">{level.icon}</span>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{level.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{level.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Health Conditions */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-base">
            <span className="w-7 h-7 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center text-sm">🏥</span>
            Health Conditions
          </h2>
          <p className="text-xs text-slate-400 mb-4">Meal plans will be filtered to only include medically safe foods</p>
          <div className="flex gap-3 flex-wrap">
            {DISEASES.map((d) => (
              <button key={d.key} type="button"
                onClick={() => setForm((prev) => ({ ...prev, [d.key]: !prev[d.key] }))}
                className={`px-5 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-150 flex items-center gap-2 ${
                  form[d.key]
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-red-300'
                }`}>
                <span>{d.icon}</span>
                <span>{d.label}</span>
                {form[d.key] && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 px-1.5 py-0.5 rounded-full">ON</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-base">
            <span className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-sm">⚠️</span>
            Food Allergies
          </h2>
          <p className="text-xs text-slate-400 mb-4">Selected allergens will be excluded from all meal suggestions</p>
          <div className="flex gap-2 flex-wrap">
            {ALLERGIES.map((a) => (
              <button key={a} type="button" onClick={() => toggleAllergy(a)}
                className={`px-4 py-2 rounded-full border-2 text-sm capitalize font-medium transition-all duration-150 ${
                  form.allergies.includes(a)
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-amber-300'
                }`}>
                {form.allergies.includes(a) ? '✓ ' : ''}{a}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-base">
            <span className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-sm">💰</span>
            Daily Food Budget (PKR)
          </h2>
          <div className="max-w-xs">
            <label className="label">Maximum daily budget in Pakistani Rupees</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₨</span>
              <input type="number" min="100" max="10000" value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
                placeholder="e.g. 500" className="input-field pl-8" required />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {[200, 350, 500, 750, 1000].map((b) => (
                <button key={b} type="button" onClick={() => setForm({ ...form, dailyBudget: b })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    parseInt(form.dailyBudget) === b
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-amber-400'
                  }`}>
                  ₨{b}/day
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile summary preview if editing */}
        {profile?.tdee && (
          <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">📊 Current Calculated Values</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'BMI', value: profile.bmi?.toFixed(1) || '—', unit: '' },
                { label: 'BMR', value: Math.round(profile.bmr) || '—', unit: 'kcal' },
                { label: 'TDEE', value: Math.round(profile.tdee) || '—', unit: 'kcal/day' },
                { label: 'Target', value: Math.round(profile.dailyCalorieTarget) || '—', unit: 'kcal/day' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="font-bold text-emerald-600 text-lg">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label} {item.unit && <span className="text-slate-400">{item.unit}</span>}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2">
          {saving ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>{profile ? '💾 Update Health Profile' : '🚀 Create Health Profile'}</>
          )}
        </button>
      </form>
    </div>
  )
}
