const mongoose = require("mongoose");
const { bloodGroups } = require("../middleware/validate");

const bloodStockSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: [true, "Blood group is required"],
      enum: bloodGroups,
      unique: true
    },
    units: {
      type: Number,
      required: [true, "Units are required"],
      min: [0, "Units cannot be negative"]
    },
    color: {
      type: String,
      default: "#ef0f54"
    },
    lowStockThreshold: {
      type: Number,
      default: 60,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodStock", bloodStockSchema);
