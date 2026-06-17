const mongoose = require("mongoose");

const employeSchema = new mongoose.Schema(
  {
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

    gender: {
      type: String,
      required: true,
    },

    dateofbirth: {
      type: Date,
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

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    
    description: {
      type: String,
      required: true,
    },

    approveStatus: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      default: "employee",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    kycDocument: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      fileUrl: {
        type: String,
        default: ""
      }
    },

    earnings: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 5.0,
    },

    attendanceStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
    }
  },
  { timestamps: true },
);

// Create a 2dsphere index for location queries
employeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Employee", employeSchema);
