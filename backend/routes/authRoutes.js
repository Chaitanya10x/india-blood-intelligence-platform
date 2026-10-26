const express = require("express");
const protect = require("../middleware/authMiddleware");
const { register, login, me, updateProfile } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfile);

module.exports = router;
