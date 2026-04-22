// src/hooks/useLocation.js
// GPS access, reverse geocoding, location persistence

import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  saveLocation,
  fetchMyLocation,
  revokeLocation,
  setManualCity,
  showLocationPrompt,
  hideLocationPrompt,
  setCoordinates,
} from '../store/slices/locationSlice'

export const PAKISTANI_CITIES = [
  'Faisalabad', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi',
  'Multan', 'Gujranwala', 'Sialkot', 'Peshawar', 'Quetta',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Sukkur',
]

/**
 * Reverse geocode using OpenStreetMap Nominatim (free, no API key)
 */
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json()
    const addr = data.address || {}
    return {
      resolvedCity: addr.city || addr.town || addr.municipality || addr.county || '',
      resolvedArea: addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '',
      resolvedAddress: data.display_name || '',
    }
  } catch {
    return { resolvedCity: '', resolvedArea: '', resolvedAddress: '' }
  }
}

export const useLocation = () => {
  const dispatch = useDispatch()
  const loc = useSelector((s) => s.location)
  const { token } = useSelector((s) => s.auth)

  // Auto-load saved location on auth
  useEffect(() => {
    if (token && !loc.locationAsked) {
      dispatch(fetchMyLocation())
    }
  }, [token, dispatch, loc.locationAsked])

  /**
   * requestGPS — triggers browser location prompt, reverse geocodes, saves to backend
   */
  const requestGPS = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by your browser.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          // Set coordinates immediately for fast UI feedback
          dispatch(setCoordinates({ latitude, longitude }))
          // Reverse geocode in parallel with saving
          const geocoded = await reverseGeocode(latitude, longitude)
          // Save to backend
          dispatch(saveLocation({ latitude, longitude, accuracy, ...geocoded }))
          resolve({ latitude, longitude, ...geocoded })
        },
        (err) => {
          dispatch(showLocationPrompt())
          reject(err)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
      )
    })
  }, [dispatch])

  const promptForLocation = useCallback(() => dispatch(showLocationPrompt()), [dispatch])
  const dismissPrompt = useCallback(() => dispatch(hideLocationPrompt()), [dispatch])
  const selectCity = useCallback((city) => dispatch(setManualCity(city)), [dispatch])
  const revoke = useCallback(() => dispatch(revokeLocation()), [dispatch])

  const effectiveCity = loc.resolvedCity || loc.manualCity || ''
  const hasLocation = loc.hasConsent || !!loc.manualCity

  return {
    ...loc,
    effectiveCity,
    hasLocation,
    requestGPS,
    promptForLocation,
    dismissPrompt,
    selectCity,
    revoke,
  }
}
