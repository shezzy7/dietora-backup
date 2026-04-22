// src/models/User.js
// Supports both email/password auth and Google OAuth

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    // ─── Password (only for email/password users) ─────────
    // Not required because Google OAuth users have no password
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // ─── Google OAuth fields ──────────────────────────────
    googleId: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple null values (for non-Google users)
    },
    avatar: {
      type: String,   // Google profile picture URL
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isEmailVerified: {
      type: Boolean,
      // Google accounts are always email-verified by Google
      default: false,
    },

    // ─── Common fields ────────────────────────────────────
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: link to HealthProfile (1:1)
userSchema.virtual('healthProfile', {
  ref: 'HealthProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

// ─── Pre-save Hook: Hash password (only for local users) ──
userSchema.pre('save', async function (next) {
  // Skip if password not set (Google users) or not modified
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare password ────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google users have no password
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Safe public object ──────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
