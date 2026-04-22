// src/App.jsx
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from './store/slices/authSlice'
import { initTheme } from './store/slices/themeSlice'
import { fetchMyLocation, showLocationPrompt } from './store/slices/locationSlice'

// Layouts
import AppLayout from './components/layout/AppLayout'
import GuestLayout from './components/layout/GuestLayout'

// Guest Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AboutPage from './pages/AboutPage'
import FaqPage from './pages/FaqPage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Pages
import DashboardPage from './pages/DashboardPage'
import HealthProfilePage from './pages/HealthProfilePage'
import MealPlanPage from './pages/MealPlanPage'
import GroceryListPage from './pages/GroceryListPage'
import BudgetPage from './pages/BudgetPage'
import EducationalHubPage from './pages/EducationalHubPage'
import ProgressPage from './pages/ProgressPage'
import FeedbackPage from './pages/FeedbackPage'
import AdminPage from './pages/AdminPage'
import StoreFinderPage from './pages/StoreFinderPage'   // ← NEW

// Global UI Components
import ChatbotWidget from './components/ChatbotWidget'
import LocationPermissionModal from './components/location/LocationPermissionModal'  // ← NEW

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading DIETORA...</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { token, initialized } = useSelector((s) => s.auth)
  if (!initialized) return <LoadingSpinner />
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const { token } = useSelector((s) => s.auth)
  const { locationAsked, hasConsent } = useSelector((s) => s.location)

  useEffect(() => {
    dispatch(initTheme())
    if (token) dispatch(fetchMe())
  }, [dispatch, token])

  // When user logs in: fetch their saved location.
  // If they have no saved location and haven't been asked yet → show modal after 2s
  useEffect(() => {
    if (!token) return

    dispatch(fetchMyLocation()).then((result) => {
      const hasExistingLocation = result?.payload?.locationConsent || result?.payload?.manualCity
      if (!hasExistingLocation && !locationAsked) {
        // Delay slightly so app finishes loading before showing modal
        setTimeout(() => dispatch(showLocationPrompt()), 2000)
      }
    })
  }, [token, dispatch])

  return (
    <>
      <Routes>
        {/* Guest Routes */}
        <Route element={<GuestLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<HealthProfilePage />} />
          <Route path="/meal-plan" element={<MealPlanPage />} />
          <Route path="/grocery" element={<GroceryListPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/education" element={<EducationalHubPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/stores" element={<StoreFinderPage />} />   {/* ← NEW */}
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Floating Components — only when logged in */}
      {token && (
        <>
          <ChatbotWidget />
          <LocationPermissionModal />   {/* ← NEW */}
        </>
      )}
    </>
  )
}
