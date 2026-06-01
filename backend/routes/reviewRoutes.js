const router = require("express").Router();
const { createReview, getHandymanReviews } = require("../controllers/reviewController");
const protect = require("../middlewares/authMiddleware");

router.post("/", protect, createReview);
router.get("/:employeeId", getHandymanReviews);

module.exports = router;
