import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProfile } from '../store/slices/profileSlice'
import { fetchMealPlans } from '../store/slices/mealPlanSlice'

function StatCard({ icon, label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    slate: 'bg-slate-50 dark:bg-slate-700/50 text-slate-500',
  }
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors[color] || colors.emerald}`}>
        {icon}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function QuickActionCard({ icon, title, desc, to, color }) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
  }
  return (
    <Link to={to} className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block`}>
      <span className="text-2xl">{icon}</span>
      <h3 className="font-display font-bold text-base mt-3">{title}</h3>
      <p className="text-white/80 text-xs mt-1 leading-relaxed">{desc}</p>
    </Link>
  )
}

export default function DashboardPage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const { data: profile } = useSelector((s) => s.profile)
  const { list: mealPlans } = useSelector((s) => s.mealPlan)

  useEffect(() => {
    dispatch(fetchProfile())
    dispatch(fetchMealPlans())
  }, [dispatch])

  const bmi = profile?.bmi
  const getBmiStatus = (bmi) => {
    if (!bmi) return { label: 'N/A', color: 'slate' }
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue' }
    if (bmi < 25) return { label: 'Normal', color: 'emerald' }
    if (bmi < 30) return { label: 'Overweight', color: 'amber' }
    return { label: 'Obese', color: 'red' }
  }
  const bmiStatus = getBmiStatus(bmi)

  const latestPlan = mealPlans?.[0]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Extract first name safely — handles null/undefined user
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            {/* BUG FIX: firstName is now always defined — no more "Good afternoon, !" */}
            <h1 className="font-display text-2xl font-bold">
              {greeting()}, {firstName}! 👋
            </h1>
            <p className="text-emerald-100 mt-1 text-sm">
              {profile
                ? 'Your health profile is set up. Ready to plan meals!'
                : 'Complete your health profile to get personalized AI meal plans.'}
            </p>
          </div>
          {!profile && (
            <Link
              to="/profile"
              className="bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors flex-shrink-0"
            >
              Setup Profile →
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="⚖️"
          label="BMI"
          value={bmi ? bmi.toFixed(1) : '—'}
          sub={bmiStatus.label}
          color={bmiStatus.color}
        />
        <StatCard
          icon="🔥"
          label="Daily Calories"
          value={profile?.tdee ? `${Math.round(profile.tdee)}` : '—'}
          sub="TDEE kcal/day"
          color="amber"
        />
        <StatCard
          icon="🍽️"
          label="Meal Plans"
          value={mealPlans?.length || 0}
          sub="Generated"
          color="blue"
        />
        {/* BUG FIX: was profile?.budgetLimit — correct field is profile?.dailyBudget */}
        <StatCard
          icon="💰"
          label="Daily Budget"
          value={profile?.dailyBudget ? `₨${profile.dailyBudget}` : '—'}
          sub="Per day (PKR)"
          color="emerald"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard icon="🤖" title="Generate Meal Plan" desc="Create a new 7-day AI plan" to="/meal-plan" color="emerald" />
          <QuickActionCard icon="🛒" title="Grocery List" desc="View items to purchase" to="/grocery" color="amber" />
          <QuickActionCard icon="📊" title="My Progress" desc="Track calories & budget" to="/progress" color="blue" />
          <QuickActionCard icon="📚" title="Learn Nutrition" desc="Articles on healthy eating" to="/education" color="purple" />
        </div>
      </div>

      {/* Health Profile Summary */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-slate-800 dark:text-white">Health Profile</h3>
              <Link to="/profile" className="text-emerald-600 text-xs font-semibold hover:underline">Edit →</Link>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Age', value: profile.age ? `${profile.age} years` : '—' },
                { label: 'Gender', value: profile.gender || '—' },
                { label: 'Height', value: profile.height ? `${profile.height} cm` : '—' },
                { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : '—' },
                { label: 'BMI', value: bmi ? `${bmi.toFixed(1)} (${bmiStatus.label})` : '—' },
                { label: 'Goal', value: profile.goal?.replace(/_/g, ' ') || '—' },
                {
                  label: 'Conditions',
                  value: [
                    profile.isDiabetic && 'Diabetes',
                    profile.isHypertensive && 'Hypertension',
                    profile.isCardiac && 'Cardiac',
                  ].filter(Boolean).join(', ') || 'None',
                },
                { label: 'Allergies', value: profile.allergies?.length ? profile.allergies.join(', ') : 'None' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0"
                >
                  <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Meal Plan */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-slate-800 dark:text-white">Latest Meal Plan</h3>
              <Link to="/meal-plan" className="text-emerald-600 text-xs font-semibold hover:underline">View All →</Link>
            </div>
            {latestPlan ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-emerald text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                    7-Day Plan
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(latestPlan.createdAt).toLocaleDateString('en-PK')}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Avg Daily Calories</span>
                    <span className="text-sm font-bold text-emerald-600">{latestPlan.avgDailyCalories || '—'} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Avg Daily Cost</span>
                    <span className="text-sm font-bold text-amber-600">₨{latestPlan.avgDailyCost || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Weekly Total Cost</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">₨{latestPlan.weeklyTotalCost || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      latestPlan.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {latestPlan.status}
                    </span>
                  </div>
                </div>
                <Link to="/meal-plan" className="block text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-2">
                  View Full Plan →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🍽️</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">No meal plans yet</p>
                <Link to="/meal-plan" className="btn-primary mt-4 inline-block py-2 px-5 text-sm">
                  Generate Plan
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Profile CTA */}
      {!profile && (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🏥</p>
          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">
            Complete your health profile
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Add your weight, height, health conditions, and daily budget to get personalized AI meal plans tailored for you.
          </p>
          <Link to="/profile" className="btn-primary inline-block py-3 px-8">
            Set Up Health Profile
          </Link>
        </div>
      )}
    </div>
  )
}
