const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    commissionRate: {
      type: Number,
      default: 15, // 15% platform fee
    },
    taxRate: {
      type: Number,
      default: 5, // 5% tax
    },
    baseDistanceFee: {
      type: Number,
      default: 5, // $5 per kilometer
    },
    siteName: {
      type: String,
      default: "HomeService",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
