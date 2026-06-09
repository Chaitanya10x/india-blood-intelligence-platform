const User = require("../models/User");
const ApiError = require("../utils/errors");
const asyncHandler = require("../utils/asyncHandler");
const { requiredString } = require("../middleware/validate");

function requireAdmin(req) {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
}

function userPayload(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

const getUsers = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const name = requiredString(req.body.name, "Name");
  const email = requiredString(req.body.email, "Email").toLowerCase();
  const password = requiredString(req.body.password, "Password");
  const role = req.body.role || "admin";

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  if (!["admin", "hospital", "donor"].includes(role)) {
    throw new ApiError(400, "Role must be admin, hospital, or donor");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json(userPayload(user));
});

const updateUser = asyncHandler(async (req, res) => {
  requireAdmin(req);
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.name = requiredString(req.body.name, "Name");
  user.email = requiredString(req.body.email, "Email").toLowerCase();
  user.role = req.body.role || user.role;

  if (!["admin", "hospital", "donor"].includes(user.role)) {
    throw new ApiError(400, "Role must be admin, hospital, or donor");
  }

  if (req.body.password) {
    if (String(req.body.password).length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }
    user.password = req.body.password;
  }

  const updated = await user.save();
  res.json(userPayload(updated));
});

const deleteUser = asyncHandler(async (req, res) => {
  requireAdmin(req);
  if (String(req.user._id) === String(req.params.id)) {
    throw new ApiError(400, "You cannot delete your active account");
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({ message: "User deleted" });
});

module.exports = { getUsers, createUser, updateUser, deleteUser };
