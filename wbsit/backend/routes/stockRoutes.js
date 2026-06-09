const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getStock,
  createStock,
  updateStock,
  deleteStock
} = require("../controllers/stockController");

const router = express.Router();

router.route("/")
  .get(protect, getStock)
  .post(protect, createStock);

router.route("/:id")
  .put(protect, updateStock)
  .delete(protect, deleteStock);

module.exports = router;
