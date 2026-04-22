// src/components/location/NearbyStoresPanel.jsx
// Shows nearby stores — used in Grocery page & chatbot responses

import { useEffect, useState } from 'react'
import { useLocation } from '../../hooks/useLocation'

const STORE_TYPE_ICONS = {
  supermarket: '🏪', grocery: '🛒', mart: '🏬', departmental: '🏢',
  kiryana: '🏘️', wholesale: '📦', pharmacy: '💊', online: '🌐',
}

const PRICING_COLORS = {
  budget: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  mid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

function StoreCard({ store }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{STORE_TYPE_ICONS[store.type] || '🛒'}</span>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">{store.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {store.address?.area && `${store.address.area}, `}{store.address?.city}
            </p>
          </div>
        </div>
        {store.distanceText && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
            📍 {store.distanceText}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRICING_COLORS[store.pricingTier] || PRICING_COLORS.mid}`}>
          {store.pricingTier === 'budget' ? '💚 Budget' : store.pricingTier === 'premium' ? '💜 Premium' : '💙 Mid-range'}
        </span>
        {store.hasHomeDelivery && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium">
            🚚 Delivery
          </span>
        )}
        {store.isHalalCertified && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 font-medium">
            ✅ Halal
          </span>
        )}
        {store.hasOnlineOrdering && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium">
            📱 Online Order
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-sm">★</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{store.rating?.toFixed(1)}</span>
          <span className="text-xs text-slate-400">({store.totalReviews?.toLocaleString()})</span>
        </div>
        {store.phone && (
          <a
            href={`tel:${store.phone}`}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            📞 Call
          </a>
        )}
      </div>
    </div>
  )
}

export default function NearbyStoresPanel({ foodQuery = '', title = 'Nearby Stores' }) {
  const {
    nearbyStores, cityStores, foodStores, storesLoading,
    hasLocation, effectiveCity, hasConsent,
    getNearbyStores, getStoresByCity, findStoresForFood,
    promptForLocation,
  } = useLocation()

  const [filter, setFilter] = useState('all')
  const [searchFood, setSearchFood] = useState(foodQuery)

  const stores = foodStores?.stores || (hasConsent ? nearbyStores : cityStores)

  useEffect(() => {
    if (!hasLocation) return
    if (foodQuery) {
      findStoresForFood(foodQuery)
    } else if (hasConsent) {
      getNearbyStores()
    } else if (effectiveCity) {
      getStoresByCity(effectiveCity)
    }
  }, [hasLocation, hasConsent, effectiveCity, foodQuery])

  const handleFoodSearch = (e) => {
    e.preventDefault()
    if (searchFood.trim()) findStoresForFood(searchFood.trim())
  }

  const filteredStores = filter === 'all'
    ? stores
    : filter === 'delivery'
    ? stores.filter((s) => s.hasHomeDelivery)
    : stores.filter((s) => s.type === filter)

  if (!hasLocation) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-3">📍</div>
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Find Stores Near You</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Enable location access or select your city to find nearby grocery stores and marts.
        </p>
        <button
          onClick={promptForLocation}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          📍 Enable Location
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
          {effectiveCity && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              📍 {hasConsent ? 'Near your location' : `In ${effectiveCity}`}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          {filteredStores.length} stores
        </span>
      </div>

      {/* Food Search */}
      <form onSubmit={handleFoodSearch} className="flex gap-2">
        <input
          value={searchFood}
          onChange={(e) => setSearchFood(e.target.value)}
          placeholder='Where to buy... (e.g. "chicken", "dal")'
          className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          🔍
        </button>
      </form>

      {/* foodStores message */}
      {foodStores?.chatMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-300">
          {foodStores.chatMessage}
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'delivery', 'supermarket', 'kiryana', 'wholesale', 'online'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {f === 'all' ? '🏪 All' :
             f === 'delivery' ? '🚚 Delivery' :
             f === 'supermarket' ? '🏪 Supermarket' :
             f === 'kiryana' ? '🏘️ Kiryana' :
             f === 'wholesale' ? '📦 Wholesale' : '🌐 Online'}
          </button>
        ))}
      </div>

      {/* Store Cards */}
      {storesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-700 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredStores.map((store) => (
            <StoreCard key={store._id} store={store} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">No stores found. Try a different filter or increase the search radius.</p>
        </div>
      )}
    </div>
  )
}
