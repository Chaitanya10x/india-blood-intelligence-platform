const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/errors");
const asyncHandler = require("../utils/asyncHandler");
const { requiredString } = require("../middleware/validate");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
}

function authPayload(user) {
  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

const register = asyncHandler(async (req, res) => {
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
  res.status(201).json(authPayload(user));
});

const login = asyncHandler(async (req, res) => {
  const email = requiredString(req.body.email, "Email").toLowerCase();
  const password = requiredString(req.body.password, "Password");

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.json(authPayload(user));
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, me };
