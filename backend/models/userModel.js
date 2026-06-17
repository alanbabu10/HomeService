const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  contact: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },

  // Geospatial geolocation point
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },

  otp: {
    code: String,
    expiresAt: Date
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date

}, { timestamps: true });

// Create a 2dsphere index for location queries
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
