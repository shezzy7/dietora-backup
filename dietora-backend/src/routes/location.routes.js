// src/routes/location.routes.js

const express = require('express');
const router = express.Router();
const {
  saveLocation, revokeLocation, getMyLocation, setCity,
  getNearbyStores, getStoresForFood, getStoreDetails,
} = require('../controllers/location.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// ─── User Location Consent ────────────────────────────────
router.post('/consent', saveLocation);
router.delete('/consent', revokeLocation);
router.get('/me', getMyLocation);
router.post('/manual-city', setCity);

// ─── Real-time Store Search (Google Places) ───────────────
router.get('/stores/nearby', getNearbyStores);
router.get('/stores/for-food/:foodName', getStoresForFood);
router.get('/stores/details/:placeId', getStoreDetails);

module.exports = router;
