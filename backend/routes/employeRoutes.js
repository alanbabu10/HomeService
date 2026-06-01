const router = require("express").Router();
const {
  employeeRegister,
  employeeLogin,
  getAllEmployees,
  approveEmployee,
  getEmployeesByService,
  toggleAvailability,
  clockAttendance,
  updateKycDocument,
  getHandymanProfile
} = require("../controllers/employeController");
const protect = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post("/register", employeeRegister);
router.post("/login", employeeLogin);
router.get("/service/:serviceId", getEmployeesByService);

// Protected Employee Routes
router.get("/profile", protect, getHandymanProfile);
router.put("/availability", protect, toggleAvailability);
router.post("/attendance", protect, clockAttendance);
router.post("/kyc", protect, upload.single("document"), updateKycDocument);

// Admin Access Employee Routes
router.get("/all", protect, adminOnly, getAllEmployees);
router.put("/approve/:id", protect, adminOnly, approveEmployee);

module.exports = router;