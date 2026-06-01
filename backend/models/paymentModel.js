const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  gateway: {
    type: String,
    enum: ["stripe", "razorpay", "wallet"],
    default: "stripe"
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
