const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital
} = require("../controllers/hospitalController");

const router = express.Router();

router.route("/")
  .get(protect, getHospitals)
  .post(protect, createHospital);

router.route("/:id")
  .put(protect, updateHospital)
  .delete(protect, deleteHospital);

module.exports = router;
