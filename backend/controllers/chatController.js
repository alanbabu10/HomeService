const ChatMessage = require("../models/chatMessageModel");
const Booking = require("../models/bookingModel");

const getChatHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await ChatMessage.find({ booking: bookingId })
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendChatMessage = async (req, res) => {
  try {
    const { bookingId, receiverId, receiverModel, message } = req.body;

    if (!bookingId || !receiverId || !receiverModel || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const senderModel = req.user.role === "employee" ? "Employee" : "User";

    const chatMessage = await ChatMessage.create({
      booking: bookingId,
      sender: req.user._id,
      senderModel,
      receiver: receiverId,
      receiverModel,
      message
    });

    res.status(201).json({ success: true, message: chatMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChatHistory,
  sendChatMessage
};
