import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const generateMealPlan = createAsyncThunk('mealPlan/generate', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/meal-plans/generate', params || {})
    toast.success('7-day meal plan generated! 🎉')
    return data
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to generate meal plan'
    return rejectWithValue(msg)
  }
})

export const fetchMealPlans = createAsyncThunk('mealPlan/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/meal-plans?limit=10')
    return data
  } catch (err) {
    if (err.response?.status === 404) return { data: [] }
    return rejectWithValue(err.response?.data?.message)
  }
})

export const fetchActivePlan = createAsyncThunk('mealPlan/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/meal-plans/active')
    return data
  } catch (err) {
    if (err.response?.status === 404) return null
    return rejectWithValue(err.response?.data?.message)
  }
})

export const fetchMealPlanById = createAsyncThunk('mealPlan/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/meal-plans/${id}`)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

// Helper: normalize backend meal plan shape to what frontend expects
function normalizePlan(plan) {
  if (!plan) return null
  // Backend stores days as array with breakfast/lunch/dinner/snack arrays
  // Frontend expects days[i].meals = { breakfast, lunch, dinner, snack }
  const normalizedDays = (plan.days || []).map((day) => {
    const meals = {}
    ;['breakfast', 'lunch', 'dinner', 'snack'].forEach((mealType) => {
      const slot = day[mealType]?.[0]
      if (slot) {
        const food = slot.foodItem || {}
        meals[mealType] = {
          name: food.name || 'Unknown',
          calories: slot.calories || food.calories || 0,
          protein: slot.protein || food.protein || 0,
          carbs: slot.carbs || food.carbs || 0,
          fat: slot.fat || food.fat || 0,
          price: slot.price || food.price || 0,
          category: food.category || '',
          is_diabetic_safe: food.is_diabetic_safe || false,
          is_hypertension_safe: food.is_hypertension_safe || false,
          is_cardiac_safe: food.is_cardiac_safe || false,
        }
      }
    })
    return {
      day: day.day,
      dayName: day.dayName,
      meals,
      totalCalories: day.totalCalories || 0,
      totalProtein: day.totalProtein || 0,
      totalCarbs: day.totalCarbs || 0,
      totalFat: day.totalFat || 0,
      totalCost: day.totalCost || 0,
    }
  })
  return {
    ...plan,
    days: normalizedDays,
    totalCost: plan.weeklyTotalCost || plan.totalCost || 0,
    totalCalories: plan.weeklyTotalCalories || plan.totalCalories || 0,
  }
}

const mealPlanSlice = createSlice({
  name: 'mealPlan',
  initialState: {
    current: null,
    list: [],
    loading: false,
    generating: false,
    error: null,
    selectedDay: 0,
  },
  reducers: {
    setSelectedDay(state, action) {
      state.selectedDay = action.payload
    },
    clearCurrent(state) {
      state.current = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate
      .addCase(generateMealPlan.pending, (state) => { state.generating = true; state.error = null })
      .addCase(generateMealPlan.fulfilled, (state, action) => {
        state.generating = false
        const raw = action.payload?.data || action.payload
        state.current = normalizePlan(raw)
        // Prepend to list
        if (state.current) state.list = [state.current, ...state.list.slice(0, 9)]
      })
      .addCase(generateMealPlan.rejected, (state, action) => {
        state.generating = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to generate plan')
      })
      // Fetch all
      .addCase(fetchMealPlans.pending, (state) => { state.loading = true })
      .addCase(fetchMealPlans.fulfilled, (state, action) => {
        state.loading = false
        const raw = action.payload?.data || []
        state.list = Array.isArray(raw) ? raw.map(normalizePlan) : []
      })
      .addCase(fetchMealPlans.rejected, (state) => { state.loading = false })
      // Fetch active
      .addCase(fetchActivePlan.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.current = normalizePlan(action.payload.data)
        }
      })
      // Fetch by ID
      .addCase(fetchMealPlanById.pending, (state) => { state.loading = true })
      .addCase(fetchMealPlanById.fulfilled, (state, action) => {
        state.loading = false
        state.current = normalizePlan(action.payload?.data || action.payload)
      })
      .addCase(fetchMealPlanById.rejected, (state) => { state.loading = false })
  },
})

export const { setSelectedDay, clearCurrent, clearError } = mealPlanSlice.actions
export default mealPlanSlice.reducer
