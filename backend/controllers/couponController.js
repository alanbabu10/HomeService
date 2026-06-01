const Coupon = require("../models/couponModel");

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ expiresAt: { $gt: new Date() }, isActive: true });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, bookingAmount } = req.body;
    if (!code || !bookingAmount) {
      return res.status(400).json({ success: false, message: "Code and bookingAmount are required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon || coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
    }

    if (bookingAmount < coupon.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount for this coupon is $${coupon.minBookingAmount}`
      });
    }

    let discount = 0;
    if (coupon.discountType === "flat") {
      discount = coupon.discountValue;
    } else {
      discount = (bookingAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    }

    res.json({
      success: true,
      message: "Coupon validated successfully",
      discount,
      finalAmount: Math.max(0, bookingAmount - discount)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minBookingAmount, maxDiscountAmount, expiresAt } = req.body;

    const exist = await Coupon.findOne({ code: code.toUpperCase() });
    if (exist) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscountAmount,
      expiresAt: new Date(expiresAt)
    });

    res.status(201).json({ success: true, message: "Coupon created successfully", coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCoupons,
  validateCoupon,
  createCoupon
};
