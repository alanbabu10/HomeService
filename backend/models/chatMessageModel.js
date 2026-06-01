const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel"
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["User", "Employee"]
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "receiverModel"
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ["User", "Employee"]
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
