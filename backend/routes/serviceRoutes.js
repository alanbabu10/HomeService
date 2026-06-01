const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");

const {
  addService,
  getAllServices,
} = require("../controllers/serviceContoller");

router.post("/add", protect, adminOnly, addService);
router.get("/", getAllServices);

module.exports = router;