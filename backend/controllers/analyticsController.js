const BloodRequest = require("../models/BloodRequest");
const BloodStock = require("../models/BloodStock");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const asyncHandler = require("../utils/asyncHandler");

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const requestStatuses = ["Pending", "Accepted", "Completed", "Rejected"];

function emptyBloodDistribution() {
  return bloodGroups.map((group) => ({ group, units: 0 }));
}

function lastSixMonthKeys() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    };
  });
}

const getAnalytics = asyncHandler(async (req, res) => {
  const [
    stock,
    monthlyRequests,
    requestStats,
    donorStats,
    hospitalStats,
    stateDemand,
    donorStateStats,
    hospitalStateStats,
    emergencyStats,
    donorCount,
    activeDonorCount,
    hospitalCount,
    connectedHospitalCount,
    requestCount,
    pendingCount,
    emergencyPendingCount
  ] = await Promise.all([
    BloodStock.find().sort({ group: 1 }),
    BloodRequest.aggregate([
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          requests: { $sum: 1 },
          units: { $sum: "$units" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    BloodRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, units: { $sum: "$units" } } }]),
    Donor.aggregate([{ $group: { _id: "$bloodGroup", count: { $sum: 1 } } }]),
    Hospital.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    BloodRequest.aggregate([
      { $group: { _id: "$state", requests: { $sum: 1 }, units: { $sum: "$units" }, emergencies: { $sum: { $cond: ["$isEmergency", 1, 0] } } } },
      { $sort: { units: -1 } }
    ]),
    Donor.aggregate([{ $group: { _id: "$state", donors: { $sum: 1 } } }]),
    Hospital.aggregate([{ $group: { _id: "$state", hospitals: { $sum: 1 }, connected: { $sum: { $cond: [{ $eq: ["$status", "Connected"] }, 1, 0] } } } }]),
    BloodRequest.aggregate([{ $group: { _id: "$isEmergency", count: { $sum: 1 }, units: { $sum: "$units" } } }]),
    Donor.countDocuments(),
    Donor.countDocuments({ isActive: true }),
    Hospital.countDocuments(),
    Hospital.countDocuments({ status: "Connected" }),
    BloodRequest.countDocuments(),
    BloodRequest.countDocuments({ status: "Pending" }),
    BloodRequest.countDocuments({ isEmergency: true, status: "Pending" })
  ]);

  const stockByGroup = new Map(stock.map((item) => [item.group, item.units]));
  const monthlyByKey = new Map(monthlyRequests.map((item) => [`${item._id.year}-${item._id.month}`, item]));
  const requestStatsByStatus = new Map(requestStats.map((item) => [item._id, item]));
  const donorStatsByGroup = new Map(donorStats.map((item) => [item._id, item.count]));
  const hospitalStatsByStatus = new Map(hospitalStats.map((item) => [item._id, item.count]));
  const stateMap = new Map();

  stateDemand.forEach((item) => {
    stateMap.set(item._id || "Unknown", {
      state: item._id || "Unknown",
      requests: item.requests,
      units: item.units,
      emergencies: item.emergencies,
      donors: 0,
      hospitals: 0,
      connectedHospitals: 0
    });
  });

  donorStateStats.forEach((item) => {
    const state = item._id || "Unknown";
    const current = stateMap.get(state) || { state, requests: 0, units: 0, emergencies: 0, donors: 0, hospitals: 0, connectedHospitals: 0 };
    current.donors = item.donors;
    stateMap.set(state, current);
  });

  hospitalStateStats.forEach((item) => {
    const state = item._id || "Unknown";
    const current = stateMap.get(state) || { state, requests: 0, units: 0, emergencies: 0, donors: 0, hospitals: 0, connectedHospitals: 0 };
    current.hospitals = item.hospitals;
    current.connectedHospitals = item.connected;
    stateMap.set(state, current);
  });

  const bloodDistribution = emptyBloodDistribution().map((item) => ({
    ...item,
    units: stockByGroup.get(item.group) || 0
  }));

  res.json({
    totals: {
      stockUnits: stock.reduce((sum, item) => sum + item.units, 0),
      donors: donorCount,
      activeDonors: activeDonorCount,
      hospitals: hospitalCount,
      connectedHospitals: connectedHospitalCount,
      requests: requestCount,
      pendingRequests: pendingCount,
      emergencyRequests: emergencyPendingCount
    },
    monthlyDonations: lastSixMonthKeys().map((item) => {
      const month = monthlyByKey.get(`${item.year}-${item.month}`);
      return {
        label: item.label,
        requests: month?.requests || 0,
        units: month?.units || 0
      };
    }),
    bloodDistribution,
    requestStatistics: requestStatuses.map((status) => {
      const item = requestStatsByStatus.get(status);
      return { status, count: item?.count || 0, units: item?.units || 0 };
    }),
    donorStatistics: bloodGroups.map((group) => ({
      bloodGroup: group,
      count: donorStatsByGroup.get(group) || 0
    })),
    hospitalStatistics: ["Connected", "Disconnected"].map((status) => ({
      status,
      count: hospitalStatsByStatus.get(status) || 0
    })),
    stateWiseAnalytics: Array.from(stateMap.values()).sort((a, b) => (b.units + b.donors + b.hospitals) - (a.units + a.donors + a.hospitals)),
    emergencyStatistics: emergencyStats.map((item) => ({
      emergency: Boolean(item._id),
      count: item.count,
      units: item.units
    }))
  });
});

module.exports = { getAnalytics };
