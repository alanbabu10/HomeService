const Booking = require("../models/bookingModel");
const Employee = require("../models/employeModel");
const Service = require("../models/serviceModel");
const Invoice = require("../models/invoiceModel");
const Wallet = require("../models/walletModel");
const Payment = require("../models/paymentModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key");
const { sendRealtimeNotification } = require("../config/socket");

// Create Booking
const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      employeeId,
      date,
      time,
      address,
      description,
      price, // Pass dynamic pricing computed from client/api
    } = req.body;

    if (!serviceId || !employeeId || !date || !time || !address) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past",
      });
    }

    const existingBooking = await Booking.findOne({
      employee: employeeId,
      date: new Date(date),
      time: time,
      status: { $nin: ["cancelled", "rejected"] }
    });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "This employee is already booked for the selected date and time slot.",
      });
    }

    const booking = await Booking.create({
      user: req.user.id,
      service: serviceId,
      employee: employeeId,
      date,
      time,
      address,
      description,
      status: "pending",
    });

    // Notify the handyman in real-time
    sendRealtimeNotification(
      employeeId.toString(),
      "employee",
      "newJobRequest",
      {
        message: "You have a new booking request!",
        bookingId: booking._id,
      }
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User Bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("service", "title price")
      .populate("employee", "name contact rating");

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Handyman Bookings
const getHandymanBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ employee: req.user.id })
      .populate("service", "title price")
      .populate("user", "name contact address");

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Booking Status (Accept/Reject, Start, Arrive, Complete, Cancel)
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. "accepted", "rejected", "started", "arrived", "completed", "cancelled"

    const booking = await Booking.findById(id).populate("service").populate("user").populate("employee");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    // If booking is cancelled, trigger refund
    if (status === "cancelled") {
      const payment = await Payment.findOne({ booking: booking._id, status: "completed" });
      if (payment) {
        let wallet = await Wallet.findOne({ user: booking.user._id });
        if (!wallet) {
          wallet = await Wallet.create({ user: booking.user._id, balance: 0, transactions: [] });
        }

        wallet.balance += payment.amount;
        wallet.transactions.push({
          amount: payment.amount,
          type: "credit",
          description: `Refund for cancelled booking ref ${booking._id}`
        });
        await wallet.save();

        payment.status = "refunded";
        await payment.save();

        if (payment.gateway === "stripe" && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_mock_key") {
          try {
            await stripe.refunds.create({
              payment_intent: payment.transactionId,
            });
          } catch (stripeErr) {
            console.error("Stripe refund failed: ", stripeErr.message);
          }
        }
      }
    }

    // Notify User about status update
    sendRealtimeNotification(
      booking.user._id.toString(),
      "user",
      "bookingStatusUpdate",
      {
        bookingId: booking._id,
        status: booking.status,
        message: `Your booking status has been updated to: ${status}`,
      }
    );

    // If booking is completed, trigger payout and invoice generation
    if (status === "completed") {
      const price = booking.service.price;
      const commissionRate = 0.15; // 15% Platform Commission
      const commission = price * commissionRate;
      const netEarnings = price - commission;

      // Update Handyman earnings
      await Employee.findByIdAndUpdate(booking.employee._id, {
        $inc: { earnings: netEarnings }
      });

      // Generate invoice
      const invoiceNumber = `INV-${Date.now()}`;
      await Invoice.create({
        booking: booking._id,
        user: booking.user._id,
        employee: booking.employee._id,
        invoiceNumber,
        subTotal: price,
        tax: price * 0.05, // 5% tax
        total: price + (price * 0.05)
      });
    }

    res.json({ success: true, message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Match nearby handyman based on Service & Location Coordinates
const findNearbyHandyman = async (req, res) => {
  try {
    const { serviceId, longitude, latitude, radiusInKm = 10 } = req.query;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: "serviceId is required" });
    }

    let query = {
      service: serviceId,
      approveStatus: true,
      isAvailable: true,
    };

    if (longitude && latitude) {
      try {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseFloat(radiusInKm) * 1000, // Distance in meters
          },
        };
        const handymen = await Employee.find(query).select("-password");
        return res.json({ success: true, handymen });
      } catch (err) {
        console.log("Geospatial index missing, falling back to service specialty matching...");
      }
    }

    // Fallback: match by service specialty and availability only
    delete query.location;
    const handymen = await Employee.find(query).select("-password");
    res.json({ success: true, handymen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate Dynamic Pricing based on Distance & Peak hour multiplier
const getDynamicPrice = async (req, res) => {
  try {
    const { serviceId, distanceInKm = 0 } = req.query;
    if (!serviceId) {
      return res.status(400).json({ success: false, message: "serviceId is required" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const basePrice = service.price;
    const distanceFee = parseFloat(distanceInKm) * 5; // e.g., $5 per KM

    // Check if peak hour (e.g., 6PM to 9PM)
    const currentHour = new Date().getHours();
    const peakHourMultiplier = (currentHour >= 18 && currentHour <= 21) ? 1.25 : 1.0;

    const dynamicPrice = Math.round((basePrice + distanceFee) * peakHourMultiplier);

    res.json({
      success: true,
      basePrice,
      distanceFee,
      peakMultiplier: peakHourMultiplier,
      finalPrice: dynamicPrice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getHandymanBookings,
  updateBookingStatus,
  findNearbyHandyman,
  getDynamicPrice
};