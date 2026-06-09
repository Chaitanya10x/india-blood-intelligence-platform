const mongoose = require("mongoose");
const ApiError = require("../utils/errors");

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function requiredString(value, label) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${label} is required`);
  }
  return value.trim();
}

function numberValue(value, label, min = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min) {
    throw new ApiError(400, `${label} must be a number greater than or equal to ${min}`);
  }
  return numeric;
}

function bloodGroup(value) {
  const group = requiredString(value, "Blood group").toUpperCase();
  if (!bloodGroups.includes(group)) {
    throw new ApiError(400, "Blood group must be A+, A-, B+, B-, AB+, AB-, O+, or O-");
  }
  return group;
}

function objectId(value, label = "Id") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `${label} is invalid`);
  }
  return value;
}

module.exports = { bloodGroups, requiredString, numberValue, bloodGroup, objectId };
