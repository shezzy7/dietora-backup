// src/models/Admin.js
// Separate Admin model (extended User privileges)

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      default: ['manage_foods', 'manage_users', 'view_feedback', 'view_analytics'],
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
