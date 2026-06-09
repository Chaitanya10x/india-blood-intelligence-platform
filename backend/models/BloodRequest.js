const mongoose = require("mongoose");
const { bloodGroups } = require("../middleware/validate");

const bloodRequestSchema = new mongoose.Schema(
  {
    patient: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: bloodGroups
    },
    units: {
      type: Number,
      required: [true, "Units are required"],
      min: [1, "Units must be at least 1"]
    },
    hospital: {
      type: String,
      required: [true, "Hospital is required"],
      trim: true
    },
    state: {
      type: String,
      default: "Delhi",
      trim: true
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Completed", "Rejected"],
      default: "Pending"
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
