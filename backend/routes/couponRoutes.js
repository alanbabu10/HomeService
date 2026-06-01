const router = require("express").Router();
const { getCoupons, validateCoupon, createCoupon } = require("../controllers/couponController");
const protect = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");

router.get("/", protect, getCoupons);
router.post("/validate", protect, validateCoupon);
router.post("/", protect, adminOnly, createCoupon);

module.exports = router;
