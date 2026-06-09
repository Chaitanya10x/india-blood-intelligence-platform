const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  approveRequest,
  rejectRequest
} = require("../controllers/requestController");

const router = express.Router();

router.route("/")
  .get(protect, getRequests)
  .post(protect, createRequest);

router.route("/:id")
  .put(protect, updateRequest)
  .delete(protect, deleteRequest);

router.patch("/:id/approve", protect, approveRequest);
router.patch("/:id/reject", protect, rejectRequest);

module.exports = router;
