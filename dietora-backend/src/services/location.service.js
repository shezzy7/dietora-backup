// src/services/location.service.js
// User location persistence — consent, GPS coords, manual city
// Store search is handled by places.service.js (Google Places API)

const UserLocation = require('../models/UserLocation');

/**
 * saveUserLocation — persist GPS coords with consent
 */
const saveUserLocation = async (userId, { longitude, latitude, accuracy, resolvedCity, resolvedArea, resolvedAddress }) => {
  return UserLocation.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      locationConsent: true,
      consentGrantedAt: new Date(),
      currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
      accuracy: accuracy || 0,
      resolvedCity: resolvedCity || '',
      resolvedArea: resolvedArea || '',
      resolvedAddress: resolvedAddress || '',
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );
};

/**
 * revokeUserLocation — GDPR-style consent revocation
 */
const revokeUserLocation = async (userId) => {
  return UserLocation.findOneAndUpdate(
    { user: userId },
    {
      locationConsent: false,
      consentRevokedAt: new Date(),
      currentLocation: { type: 'Point', coordinates: [0, 0] },
      resolvedCity: '',
      resolvedArea: '',
      resolvedAddress: '',
    },
    { new: true }
  );
};

/**
 * getUserLocation — fetch saved location for a user
 */
const getUserLocation = async (userId) => {
  return UserLocation.findOne({ user: userId });
};

/**
 * setManualCity — fallback when GPS is denied
 */
const setManualCity = async (userId, city) => {
  return UserLocation.findOneAndUpdate(
    { user: userId },
    { manualCity: city, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = { saveUserLocation, revokeUserLocation, getUserLocation, setManualCity };
