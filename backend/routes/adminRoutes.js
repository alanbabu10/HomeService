const router = require("express").Router();
const {
  getDashboardAnalytics,
  updateKycStatus,
  getDisputes,
  resolveDispute,
  getUsers,
  toggleBlockUser,
  updateUser,
  deleteUser,
  getEmployees,
  toggleBlockEmployee,
  updateEmployee,
  deleteEmployee,
  getBookings,
  updateBooking,
  deleteBooking,
  getPayments,
  refundPayment,
  getCouponsAll,
  updateCoupon,
  deleteCoupon,
  getReviews,
  deleteReview,
  getCms,
  updateCms,
  getSettings,
  updateSettings,
  sendNotification,
  getNotifications
} = require("../controllers/adminController");
const protect = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");

// Dashboard Analytics
router.get("/analytics", protect, adminOnly, getDashboardAnalytics);

// User Management
router.get("/users", protect, adminOnly, getUsers);
router.put("/users/:id/block", protect, adminOnly, toggleBlockUser);
router.put("/users/:id", protect, adminOnly, updateUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);

// Employee Management
router.get("/employees", protect, adminOnly, getEmployees);
router.put("/employees/:id/block", protect, adminOnly, toggleBlockEmployee);
router.put("/employees/:id", protect, adminOnly, updateEmployee);
router.delete("/employees/:id", protect, adminOnly, deleteEmployee);
router.put("/kyc", protect, adminOnly, updateKycStatus);

// Dispute Resolutions
router.get("/disputes", protect, adminOnly, getDisputes);
router.put("/disputes/:id", protect, adminOnly, resolveDispute);

// Bookings Management
router.get("/bookings", protect, adminOnly, getBookings);
router.put("/bookings/:id", protect, adminOnly, updateBooking);
router.delete("/bookings/:id", protect, adminOnly, deleteBooking);

// Payments Management
router.get("/payments", protect, adminOnly, getPayments);
router.post("/payments/:id/refund", protect, adminOnly, refundPayment);

// Coupons Management
router.get("/coupons", protect, adminOnly, getCouponsAll);
router.put("/coupons/:id", protect, adminOnly, updateCoupon);
router.delete("/coupons/:id", protect, adminOnly, deleteCoupon);

// Reviews Management
router.get("/reviews", protect, adminOnly, getReviews);
router.delete("/reviews/:id", protect, adminOnly, deleteReview);

// CMS Content Management
router.get("/cms", protect, adminOnly, getCms);
router.put("/cms", protect, adminOnly, updateCms);

// System Settings
router.get("/settings", protect, adminOnly, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);

// Notifications System
router.post("/notifications/send", protect, adminOnly, sendNotification);
router.get("/notifications", protect, adminOnly, getNotifications);

module.exports = router;
