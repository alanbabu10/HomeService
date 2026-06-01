const router = require("express").Router();
const { getCategories, createCategory, updateCategory } = require("../controllers/categoryController");
const protect = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");

router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);

module.exports = router;
