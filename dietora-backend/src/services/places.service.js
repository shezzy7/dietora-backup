// src/services/places.service.js
// Real-time Google Places API — finds actual stores near user GPS
// API key is read at call-time (not module load) to support .env properly

const axios = require('axios');

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

// Read key at call-time — never at module load
const getApiKey = () => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables.');
  return key;
};

// Food category → best Google Places search queries (Pakistani context)
const CATEGORY_QUERIES = {
  meat:       ['halal butcher', 'chicken shop', 'meat shop'],
  lentils:    ['kiryana store', 'grocery store', 'general store'],
  rice:       ['kiryana store', 'grocery store'],
  bread:      ['bakery', 'roti shop', 'tandoor'],
  vegetables: ['sabzi mandi', 'vegetable market'],
  dairy:      ['dairy shop', 'milk shop'],
  fruits:     ['fruit shop', 'fruit market'],
  snack:      ['grocery store', 'supermarket'],
  beverage:   ['grocery store', 'supermarket'],
  grocery:    ['grocery store', 'kiryana store', 'supermarket'],
};

/**
 * searchNearbyStores
 * Google Places Nearby Search API
 */
const searchNearbyStores = async (latitude, longitude, radiusMeters = 3000, keyword = 'grocery store') => {
  const key = getApiKey();
  const res = await axios.get(`${PLACES_BASE}/nearbysearch/json`, {
    params: {
      location: `${latitude},${longitude}`,
      radius: radiusMeters,
      keyword,
      key,
      language: 'en',
    },
    timeout: 8000,
  });

  if (res.data.status !== 'OK' && res.data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places error: ${res.data.status} — ${res.data.error_message || 'No details'}`);
  }

  return (res.data.results || []).map(_formatPlace);
};

/**
 * searchStoresForFood
 * Runs 2 smart queries based on food category, deduplicates results
 */
const searchStoresForFood = async (foodCategory, foodName, latitude, longitude, radiusMeters = 5000) => {
  const queries = CATEGORY_QUERIES[foodCategory] || CATEGORY_QUERIES.grocery;

  const results = await Promise.all(
    queries.slice(0, 2).map((q) =>
      searchNearbyStores(latitude, longitude, radiusMeters, q).catch(() => [])
    )
  );

  // Deduplicate by place_id
  const seen = new Set();
  return results.flat().filter((p) => {
    if (seen.has(p.placeId)) return false;
    seen.add(p.placeId);
    return true;
  }).slice(0, 8);
};

/**
 * getPlaceDetails
 * Full details for a single place (phone, hours, website)
 */
const getPlaceDetails = async (placeId) => {
  const key = getApiKey();
  const res = await axios.get(`${PLACES_BASE}/details/json`, {
    params: {
      place_id: placeId,
      fields: 'name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,website,geometry',
      key,
      language: 'en',
    },
    timeout: 8000,
  });

  if (res.data.status !== 'OK') throw new Error(`Place details error: ${res.data.status}`);

  const p = res.data.result;
  return {
    placeId,
    name: p.name,
    address: p.formatted_address,
    phone: p.formatted_phone_number || null,
    website: p.website || null,
    rating: p.rating || null,
    totalRatings: p.user_ratings_total || 0,
    isOpenNow: p.opening_hours?.open_now ?? null,
    openingHours: p.opening_hours?.weekday_text || [],
    coordinates: {
      latitude: p.geometry?.location?.lat,
      longitude: p.geometry?.location?.lng,
    },
  };
};

/**
 * attachDistances
 * Calculates haversine distance from user to each place, sorts by nearest
 */
const attachDistances = (places, userLat, userLng) => {
  return places
    .map((place) => {
      const dist = _haversine(userLat, userLng, place.coordinates.latitude, place.coordinates.longitude);
      return {
        ...place,
        distanceKm: parseFloat(dist.toFixed(2)),
        distanceText: dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

// ─── Internal helpers ─────────────────────────────────────
const _formatPlace = (place) => {
  const lat = place.geometry?.location?.lat || 0;
  const lng = place.geometry?.location?.lng || 0;
  return {
    placeId: place.place_id,
    name: place.name,
    address: place.vicinity || place.formatted_address || '',
    rating: place.rating || null,
    totalRatings: place.user_ratings_total || 0,
    isOpenNow: place.opening_hours?.open_now ?? null,
    priceLevel: place.price_level ?? null,
    types: place.types || [],
    coordinates: { latitude: lat, longitude: lng },
    mapsLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    directionsLink: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    distanceKm: 0, // overwritten by attachDistances
  };
};

const _haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = {
  searchNearbyStores,
  searchStoresForFood,
  getPlaceDetails,
  attachDistances,
  haversine: _haversine,
};
