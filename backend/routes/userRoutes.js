const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/userController");

const router = express.Router();

router.route("/")
  .get(protect, getUsers)
  .post(protect, createUser);

router.route("/:id")
  .put(protect, updateUser)
  .delete(protect, deleteUser);

module.exports = router;
