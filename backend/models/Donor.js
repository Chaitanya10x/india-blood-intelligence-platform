const mongoose = require("mongoose");
const { bloodGroups } = require("../middleware/validate");

const donorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Donor name is required"],
      trim: true
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: bloodGroups
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    state: {
      type: String,
      default: "Delhi",
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[+()\-\s0-9]{7,20}$/, "Phone number is invalid"]
    },
    lastDonationDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donor", donorSchema);
