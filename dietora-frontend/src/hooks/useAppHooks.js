import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile } from '../store/slices/profileSlice'
import { fetchMealPlans } from '../store/slices/mealPlanSlice'

// Hook: fetch profile once on mount
export function useProfile() {
  const dispatch = useDispatch()
  const { data, loading, error } = useSelector((s) => s.profile)

  useEffect(() => {
    if (!data) dispatch(fetchProfile())
  }, [dispatch, data])

  return { profile: data, loading, error }
}

// Hook: fetch meal plans once on mount
export function useMealPlans() {
  const dispatch = useDispatch()
  const { list, current, loading } = useSelector((s) => s.mealPlan)

  useEffect(() => {
    dispatch(fetchMealPlans())
  }, [dispatch])

  return { plans: list, current, loading, latestPlan: list?.[0] }
}

// Hook: local form state with validation
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const setError = (field, message) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }

  const touch = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, setValue, setError, touch, reset, setValues, setErrors }
}

// Hook: debounce
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Hook: window size
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return size
}

// Hook: is mobile
export function useIsMobile() {
  const { width } = useWindowSize()
  return width < 768
}
