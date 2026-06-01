const router = require("express").Router();
const { getChatHistory, sendChatMessage } = require("../controllers/chatController");
const protect = require("../middlewares/authMiddleware");

router.get("/:bookingId", protect, getChatHistory);
router.post("/", protect, sendChatMessage);

module.exports = router;
