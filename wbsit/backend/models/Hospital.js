const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
      unique: true
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true
    },
    city: {
      type: String,
      default: "Delhi",
      trim: true
    },
    state: {
      type: String,
      default: "Delhi",
      trim: true
    },
    status: {
      type: String,
      enum: ["Connected", "Disconnected"],
      default: "Connected"
    },
    contactPhone: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);
