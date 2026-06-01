const User = require("../models/userModel");
const Employee = require("../models/employeModel");
const Booking = require("../models/bookingModel");
const Dispute = require("../models/disputeModel");
const Payment = require("../models/paymentModel");
const Wallet = require("../models/walletModel");

// Get Admin Dashboard Analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalEmployees = await Employee.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingKyc = await Employee.countDocuments({ "kycDocument.status": "pending" });
    const openDisputes = await Dispute.countDocuments({ status: "open" });

    // Calculate total revenues from successful payments
    const successfulPayments = await Payment.find({ status: "completed" });
    const totalRevenue = successfulPayments.reduce((acc, pay) => acc + pay.amount, 0);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalEmployees,
        totalBookings,
        totalRevenue,
        pendingKyc,
        openDisputes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Handyman KYC approval status
const updateKycStatus = async (req, res) => {
  try {
    const { employeeId, status } = req.body; // status: "approved" or "rejected"
    if (!employeeId || !status) {
      return res.status(400).json({ success: false, message: "employeeId and status are required" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    employee.kycDocument.status = status;
    // Auto-approve account login state if KYC is approved
    if (status === "approved") {
      employee.approveStatus = true;
    }
    await employee.save();

    res.json({ success: true, message: `KYC document status updated to ${status}`, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Disputes: Get All disputes
const getDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate("booking")
      .populate("user", "name email")
      .populate("employee", "name email");

    res.json({ success: true, disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Disputes: Resolve and potentially trigger refund
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionDetails } = req.body; // status: "resolved" or "refunded"

    const dispute = await Dispute.findById(id).populate("booking").populate("user");
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    dispute.status = status;
    dispute.resolutionDetails = resolutionDetails;
    await dispute.save();

    // Trigger refund if status is set to refunded
    if (status === "refunded") {
      // Find completed payment for this booking
      const payment = await Payment.findOne({ booking: dispute.booking._id, status: "completed" });
      if (payment) {
        payment.status = "refunded";
        await payment.save();

        // Update booking status
        dispute.booking.status = "cancelled";
        await dispute.booking.save();

        // Credit money back to user's wallet
        let wallet = await Wallet.findOne({ user: dispute.user._id });
        if (!wallet) {
          wallet = await Wallet.create({ user: dispute.user._id, balance: 0, transactions: [] });
        }
        wallet.balance += payment.amount;
        wallet.transactions.push({
          amount: payment.amount,
          type: "credit",
          description: `Refund for booking dispute resolution ref ${dispute.booking._id}`
        });
        await wallet.save();
      }
    }

    res.json({ success: true, message: `Dispute resolved with status: ${status}`, dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch all users list
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
  updateKycStatus,
  getDisputes,
  resolveDispute,
  getUsers
};
