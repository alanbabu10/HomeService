const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["open", "under_review", "resolved", "refunded"],
    default: "open"
  },
  resolutionDetails: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Dispute", disputeSchema);
