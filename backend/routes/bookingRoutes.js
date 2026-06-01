const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  createBooking,
  getMyBookings,
  getHandymanBookings,
  updateBookingStatus,
  findNearbyHandyman,
  getDynamicPrice
} = require("../controllers/bookingController");

router.post("/create", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/handyman", protect, getHandymanBookings);
router.put("/status/:id", protect, updateBookingStatus);
router.get("/nearby", protect, findNearbyHandyman);
router.get("/pricing", protect, getDynamicPrice);

module.exports = router;