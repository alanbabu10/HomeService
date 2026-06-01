// Initialize Stripe (uses fallback key if not set in process.env)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key");
const Payment = require("../models/paymentModel");
const Booking = require("../models/bookingModel");
const Wallet = require("../models/walletModel");

// Create a Stripe Payment Intent for Checkout
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, message: "bookingId and amount are required" });
    }

    // Convert amount to cents for Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: { bookingId: bookingId.toString(), userId: req.user._id.toString() }
    });

    // Create a pending payment log
    await Payment.create({
      user: req.user._id,
      booking: bookingId,
      amount,
      status: "pending",
      gateway: "stripe",
      transactionId: paymentIntent.id
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      transactionId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm payment (Simulates client confirming successful transaction, useful for sandbox/testing)
const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment log not found" });
    }

    payment.status = "completed";
    await payment.save();

    // Mark the corresponding booking as completed/accepted as appropriate
    await Booking.findByIdAndUpdate(payment.booking, { status: "accepted" });

    res.json({ success: true, message: "Payment confirmed successfully", payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Wallet: Get user's wallet details
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0, transactions: [] });
    }
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Wallet: Add funds (Top-up)
const topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0, transactions: [] });
    }

    wallet.balance += Number(amount);
    wallet.transactions.push({
      amount: Number(amount),
      type: "credit",
      description: "Wallet top-up successful"
    });

    await wallet.save();
    res.json({ success: true, message: "Wallet topped up successfully", wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Wallet: Pay for a booking
const payWithWallet = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, message: "bookingId and amount are required" });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // Deduct from wallet
    wallet.balance -= Number(amount);
    wallet.transactions.push({
      amount: Number(amount),
      type: "debit",
      description: `Payment for booking ref ${bookingId}`
    });
    await wallet.save();

    // Log the completed payment
    const payment = await Payment.create({
      user: req.user._id,
      booking: bookingId,
      amount,
      status: "completed",
      gateway: "wallet",
      transactionId: `WAL-${Date.now()}`
    });

    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, { status: "accepted" });

    res.json({ success: true, message: "Payment processed via wallet", payment, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getWallet,
  topUpWallet,
  payWithWallet
};
