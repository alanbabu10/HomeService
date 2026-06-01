const Review = require("../models/reviewModel");
const Booking = require("../models/bookingModel");

const createReview = async (req, res) => {
  try {
    const { bookingId, employeeId, rating, comment } = req.body;

    if (!bookingId || !employeeId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Verify booking matches and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ success: false, message: "You can only review completed jobs" });
    }

    const review = await Review.create({
      booking: bookingId,
      user: req.user._id,
      employee: employeeId,
      rating,
      comment
    });

    res.status(201).json({ success: true, message: "Review submitted successfully", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHandymanReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ employee: req.params.employeeId })
      .populate("user", "name");

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getHandymanReviews
};
