// src/controllers/location.controller.js
// Real-time location controller — uses Google Places API, NO seeded store data

const {
  searchNearbyStores,
  searchStoresForFood,
  getPlaceDetails,
  attachDistances,
} = require('../services/places.service');
const {
  saveUserLocation,
  revokeUserLocation,
  getUserLocation,
  setManualCity,
} = require('../services/location.service');
const { successResponse } = require('../utils/response.utils');

/**
 * @route   POST /api/v1/location/consent
 * @desc    Save user GPS coordinates with consent
 * @access  Private
 */
const saveLocation = async (req, res, next) => {
  try {
    const { longitude, latitude, accuracy, resolvedCity, resolvedArea, resolvedAddress } = req.body;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ success: false, message: 'longitude and latitude are required.' });
    }

    const loc = await saveUserLocation(req.user._id, {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      accuracy, resolvedCity, resolvedArea, resolvedAddress,
    });

    return successResponse(res, {
      locationConsent: loc.locationConsent,
      resolvedCity: loc.resolvedCity,
      resolvedArea: loc.resolvedArea,
      coordinates: loc.currentLocation?.coordinates,
    }, '📍 Location saved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/location/consent
 * @desc    Revoke location consent (GDPR-style)
 * @access  Private
 */
const revokeLocation = async (req, res, next) => {
  try {
    await revokeUserLocation(req.user._id);
    return successResponse(res, {}, 'Location access revoked. GPS data cleared.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/location/me
 * @desc    Get user's saved location
 * @access  Private
 */
const getMyLocation = async (req, res, next) => {
  try {
    const loc = await getUserLocation(req.user._id);
    if (!loc) {
      return res.status(404).json({
        success: false,
        message: 'No location data found.',
        requiresLocation: true,
      });
    }
    return successResponse(res, {
      locationConsent: loc.locationConsent,
      resolvedCity: loc.resolvedCity,
      resolvedArea: loc.resolvedArea,
      resolvedAddress: loc.resolvedAddress,
      manualCity: loc.manualCity,
      coordinates: loc.locationConsent ? loc.currentLocation?.coordinates : null,
      lastUpdated: loc.lastUpdated,
    }, 'Location fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/location/manual-city
 * @desc    Set city manually when GPS not available
 * @access  Private
 */
const setCity = async (req, res, next) => {
  try {
    const { city } = req.body;
    if (!city?.trim()) return res.status(400).json({ success: false, message: 'City is required.' });
    await setManualCity(req.user._id, city.trim());
    return successResponse(res, { manualCity: city }, `City set to ${city}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/location/stores/nearby
 * @desc    Find real grocery stores near GPS location (Google Places)
 * @access  Private
 * @query   latitude, longitude, radius (meters, default 3000), keyword
 */
const getNearbyStores = async (req, res, next) => {
  try {
    let { latitude, longitude, radius = 3000, keyword = 'grocery store supermarket kiryana' } = req.query;

    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);

    // Fall back to saved location if coords not in query
    if (!lat || !lng) {
      const saved = await getUserLocation(req.user._id);
      if (!saved?.locationConsent || !saved?.currentLocation?.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'GPS location required. Please enable location access.',
          requiresLocation: true,
        });
      }
      [lng, lat] = saved.currentLocation.coordinates;
    }

    const rawStores = await searchNearbyStores(lat, lng, parseInt(radius), keyword);
    const stores = attachDistances(rawStores, lat, lng);

    return successResponse(res, {
      userLocation: { latitude: lat, longitude: lng },
      radiusMeters: parseInt(radius),
      count: stores.length,
      stores,
    }, `Found ${stores.length} stores nearby`);
  } catch (error) {
    if (error.message?.includes('GOOGLE_PLACES_API_KEY')) {
      return res.status(503).json({ success: false, message: 'Maps service not configured.' });
    }
    next(error);
  }
};

/**
 * @route   GET /api/v1/location/stores/for-food/:foodName
 * @desc    Real-time: "Where can I buy X?" — Google Places search
 * @access  Private
 * @query   radius (meters, default 5000)
 */
const getStoresForFood = async (req, res, next) => {
  try {
    const { foodName } = req.params;
    const { radius = 5000 } = req.query;

    const saved = await getUserLocation(req.user._id);

    if (!saved?.locationConsent || !saved?.currentLocation?.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'GPS location required to find nearby stores. Please enable location.',
        requiresLocation: true,
      });
    }

    const [lng, lat] = saved.currentLocation.coordinates;

    // Determine food category for smart query selection
    const CATEGORY_MAP = {
      chicken: 'meat', beef: 'meat', mutton: 'meat', gosht: 'meat', murgh: 'meat',
      fish: 'meat', machli: 'meat', qeema: 'meat',
      dal: 'lentils', daal: 'lentils', masoor: 'lentils', chana: 'lentils',
      sabzi: 'vegetables', bhindi: 'vegetables', aloo: 'vegetables', palak: 'vegetables',
      dahi: 'dairy', yogurt: 'dairy', milk: 'dairy', doodh: 'dairy', paneer: 'dairy',
      chawal: 'rice', rice: 'rice', basmati: 'rice',
      roti: 'bread', naan: 'bread', atta: 'bread',
    };

    const lowerFood = foodName.toLowerCase();
    let category = 'grocery';
    for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
      if (lowerFood.includes(kw)) { category = cat; break; }
    }

    const rawStores = await searchStoresForFood(category, foodName, lat, lng, parseInt(radius));
    const stores = attachDistances(rawStores, lat, lng);

    const topNames = stores.slice(0, 3).map((s) => `${s.name} (${s.distanceText})`).join(', ');
    const chatMessage = stores.length > 0
      ? `You can buy **${foodName}** at: ${topNames}${stores.length > 3 ? ` and ${stores.length - 3} more nearby.` : '.'}`
      : `No stores found for "${foodName}" within ${Math.round(radius / 1000)}km. Try increasing the radius.`;

    return successResponse(res, {
      foodName,
      category,
      userLocation: { latitude: lat, longitude: lng },
      count: stores.length,
      chatMessage,
      stores,
    }, chatMessage);
  } catch (error) {
    if (error.message?.includes('GOOGLE_PLACES_API_KEY')) {
      return res.status(503).json({ success: false, message: 'Maps service not configured.' });
    }
    next(error);
  }
};

/**
 * @route   GET /api/v1/location/stores/details/:placeId
 * @desc    Get full details of a specific Google Place
 * @access  Private
 */
const getStoreDetails = async (req, res, next) => {
  try {
    const details = await getPlaceDetails(req.params.placeId);
    return successResponse(res, details, 'Store details fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveLocation, revokeLocation, getMyLocation, setCity,
  getNearbyStores, getStoresForFood, getStoreDetails,
};
