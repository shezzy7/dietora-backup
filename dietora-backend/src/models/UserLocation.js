// src/models/UserLocation.js
// Stores user's location consent and coordinates

const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // ─── Consent ─────────────────────────────────────────
    locationConsent: {
      type: Boolean,
      default: false,
    },
    consentGrantedAt: { type: Date },
    consentRevokedAt: { type: Date },
    // ─── Live GPS Coordinates ────────────────────────────
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    // ─── Resolved Address ────────────────────────────────
    resolvedCity: { type: String, default: '' },
    resolvedArea: { type: String, default: '' },
    resolvedAddress: { type: String, default: '' },
    // ─── Manual Fallback ─────────────────────────────────
    manualCity: { type: String, default: '' },
    // ─── Metadata ────────────────────────────────────────
    lastUpdated: { type: Date, default: Date.now },
    accuracy: { type: Number, default: 0 }, // meters
  },
  { timestamps: true }
);

userLocationSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('UserLocation', userLocationSchema);
