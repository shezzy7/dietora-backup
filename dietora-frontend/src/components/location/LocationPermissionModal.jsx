// src/components/location/LocationPermissionModal.jsx
// Shown when app needs location — asks GPS or manual city

import { useState } from 'react'
import { useLocation, PAKISTANI_CITIES } from '../../hooks/useLocation'

export default function LocationPermissionModal() {
  const {
    showLocationModal, loading,
    requestGPS, dismissPrompt, selectCity,
  } = useLocation()

  const [step, setStep] = useState('ask')   // 'ask' | 'city'
  const [selectedCity, setSelectedCity] = useState('')

  if (!showLocationModal) return null

  const handleAllowGPS = async () => {
    try {
      await requestGPS()
    } catch {
      setStep('city')
    }
  }

  const handleCitySubmit = () => {
    if (!selectedCity) return
    selectCity(selectedCity)
  }

  return (
    // navbar h-16 = 64px, isliye pt-20 (80px) se start karo
    // overflow-y-auto + py-4 taake bottom content b visible rahe
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 overflow-y-auto"
         style={{ paddingTop: 'max(80px, env(safe-area-inset-top, 80px))', paddingBottom: '24px' }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {step === 'ask' ? (
          <>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
              <div className="text-5xl mb-2">📍</div>
              <h2 className="text-white text-xl font-bold">Enable Location Access</h2>
              <p className="text-emerald-100 text-sm mt-1">So DIETORA can find stores near you</p>
            </div>

            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center mb-5">
                DIETORA uses your location to find nearby grocery stores, marts, and kiryana shops
                where you can buy your meal plan ingredients.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { icon: '🛒', text: 'Find grocery stores near you' },
                  { icon: '🥩', text: '"Where can I buy chicken?" → Instant answer' },
                  { icon: '🚚', text: 'Stores with home delivery highlighted' },
                  { icon: '💰', text: 'Compare prices across nearby shops' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-5">
                🔒 Your location is only used to find nearby stores and is never shared with third parties.
              </p>

              <button
                onClick={handleAllowGPS}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
              >
                {loading ? 'Getting location...' : '📍 Allow Location Access'}
              </button>
              <button
                onClick={() => setStep('city')}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-xl transition-colors mb-3"
              >
                🏙️ Select My City Instead
              </button>
              <button onClick={dismissPrompt} className="w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors">
                Not now
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
              <div className="text-5xl mb-2">🏙️</div>
              <h2 className="text-white text-xl font-bold">Select Your City</h2>
              <p className="text-emerald-100 text-sm mt-1">We'll show stores in your city</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-2 mb-5 max-h-64 overflow-y-auto pr-1">
                {PAKISTANI_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      selectedCity === city
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCitySubmit}
                disabled={!selectedCity || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
              >
                {loading ? 'Saving...' : selectedCity ? `Confirm — ${selectedCity}` : 'Select a city'}
              </button>
              <button onClick={() => setStep('ask')} className="w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors">
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
