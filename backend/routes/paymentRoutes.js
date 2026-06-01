const router = require("express").Router();
const {
  createPaymentIntent,
  confirmPayment,
  getWallet,
  topUpWallet,
  payWithWallet
} = require("../controllers/paymentController");
const protect = require("../middlewares/authMiddleware");

router.post("/charge", protect, createPaymentIntent);
router.post("/confirm", protect, confirmPayment);
router.get("/wallet", protect, getWallet);
router.post("/wallet/topup", protect, topUpWallet);
router.post("/wallet/pay", protect, payWithWallet);

module.exports = router;
