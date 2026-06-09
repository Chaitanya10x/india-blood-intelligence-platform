const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getDonors,
  createDonor,
  updateDonor,
  deleteDonor
} = require("../controllers/donorController");

const router = express.Router();

router.route("/")
  .get(protect, getDonors)
  .post(protect, createDonor);

router.route("/:id")
  .put(protect, updateDonor)
  .delete(protect, deleteDonor);

module.exports = router;
