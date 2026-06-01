const router = require("express").Router();
const {
  getDashboardAnalytics,
  updateKycStatus,
  getDisputes,
  resolveDispute,
  getUsers
} = require("../controllers/adminController");
const protect = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");

router.get("/analytics", protect, adminOnly, getDashboardAnalytics);
router.get("/users", protect, adminOnly, getUsers);
router.put("/kyc", protect, adminOnly, updateKycStatus);
router.get("/disputes", protect, adminOnly, getDisputes);
router.put("/disputes/:id", protect, adminOnly, resolveDispute);

module.exports = router;
