const BloodRequest = require("../models/BloodRequest");
const BloodStock = require("../models/BloodStock");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const asyncHandler = require("../utils/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const [lowStock, emergencyRequests, newDonors, newHospitals] = await Promise.all([
    BloodStock.find({ $expr: { $lte: ["$units", "$lowStockThreshold"] } }).sort({ units: 1 }),
    BloodRequest.find({ isEmergency: true, status: "Pending" }).sort({ createdAt: -1 }),
    Donor.find().sort({ createdAt: -1 }).limit(5),
    Hospital.find().sort({ createdAt: -1 }).limit(5)
  ]);

  const notifications = [
    ...lowStock.map((item) => ({
      type: "Low Stock",
      severity: item.units <= Math.max(20, item.lowStockThreshold * 0.45) ? "critical" : "warning",
      title: `${item.group} stock is low`,
      message: `${item.units} units available. Threshold is ${item.lowStockThreshold}.`,
      createdAt: item.updatedAt
    })),
    ...emergencyRequests.map((item) => ({
      type: "Emergency Request",
      severity: "critical",
      title: `${item.bloodGroup} emergency request`,
      message: `${item.patient} needs ${item.units} unit(s) at ${item.hospital}, ${item.state}.`,
      createdAt: item.createdAt
    })),
    ...newDonors.map((item) => ({
      type: "New Donor",
      severity: "info",
      title: `${item.name} registered`,
      message: `${item.bloodGroup} donor in ${item.city}, ${item.state}.`,
      createdAt: item.createdAt
    })),
    ...newHospitals.map((item) => ({
      type: "New Hospital",
      severity: "info",
      title: `${item.name} connected`,
      message: `${item.area}, ${item.city}, ${item.state}.`,
      createdAt: item.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(notifications);
});

module.exports = { getNotifications };
