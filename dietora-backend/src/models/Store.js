// src/models/Store.js
// Pakistani grocery stores & marts database with location data

const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['supermarket', 'grocery', 'mart', 'departmental', 'kiryana', 'wholesale', 'pharmacy', 'online'],
      required: true,
    },
    // ─── Location ─────────────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      street: { type: String, default: '' },
      area: { type: String, default: '' },
      city: {
        type: String,
        required: true,
        enum: [
          'Faisalabad', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi',
          'Multan', 'Gujranwala', 'Sialkot', 'Peshawar', 'Quetta',
          'Hyderabad', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Sukkur',
        ],
      },
      province: { type: String, default: '' },
    },
    // ─── Contact ──────────────────────────────────────────
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    // ─── Food Categories Available ────────────────────────
    availableCategories: {
      type: [String],
      default: [],
      // e.g. ['lentils','meat','vegetables','dairy','rice']
    },
    // ─── Features ─────────────────────────────────────────
    hasHomeDelivery: { type: Boolean, default: false },
    hasOnlineOrdering: { type: Boolean, default: false },
    isHalalCertified: { type: Boolean, default: true },
    isOpen24Hours: { type: Boolean, default: false },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '22:00' },
    // ─── Pricing Tier ─────────────────────────────────────
    pricingTier: {
      type: String,
      enum: ['budget', 'mid', 'premium'],
      default: 'mid',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.0,
    },
    totalReviews: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    // ─── Tags ─────────────────────────────────────────────
    tags: {
      type: [String],
      default: [],
      // e.g. ['organic', 'imported', 'local', 'wholesale']
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
storeSchema.index({ location: '2dsphere' });
storeSchema.index({ 'address.city': 1 });
storeSchema.index({ type: 1 });

module.exports = mongoose.model('Store', storeSchema);
