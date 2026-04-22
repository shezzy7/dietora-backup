import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'

// Shared custom tooltip
export function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">
            {p.name}: <strong>{p.value}</strong>{p.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Calories line chart
export function CaloriesChart({ data, targetKey = 'target', actualKey = 'calories' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area type="monotone" dataKey={actualKey} stroke="#10b981" strokeWidth={2.5} fill="url(#calGrad)" dot={{ r: 4, fill: '#10b981' }} name="Calories" unit=" kcal" />
        <Line type="monotone" dataKey={targetKey} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" unit=" kcal" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Budget bar chart
export function BudgetChart({ data, spentKey = 'spent', budgetKey = 'budget' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey={spentKey} fill="#f59e0b" radius={[6, 6, 0, 0]} name="Spent" unit=" ₨" />
        <Bar dataKey={budgetKey} fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Budget" unit=" ₨" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Macros donut chart
export function MacrosPieChart({ data }) {
  if (!data?.length) return <p className="text-slate-400 text-sm text-center py-8">No macro data available</p>
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${v}g`, '']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Weekly progress line chart (multi-line)
export function WeeklyProgressChart({ data, lines = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3, fill: line.color }}
            name={line.label}
            unit={line.unit || ''}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
