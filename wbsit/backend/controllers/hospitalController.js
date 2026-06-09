const Hospital = require("../models/Hospital");
const BloodStock = require("../models/BloodStock");
const asyncHandler = require("../utils/asyncHandler");
const { requiredString, objectId } = require("../middleware/validate");

function hospitalInput(body) {
  return {
    name: requiredString(body.name, "Hospital name"),
    area: requiredString(body.area, "Area"),
    city: body.city ? requiredString(body.city, "City") : "Delhi",
    state: body.state ? requiredString(body.state, "State") : "Delhi",
    status: body.status || "Connected",
    contactPhone: body.contactPhone || ""
  };
}

const getHospitals = asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find().sort({ createdAt: -1 });
  const totalStock = await BloodStock.aggregate([{ $group: { _id: null, total: { $sum: "$units" } } }]);
  const fallbackStock = totalStock[0]?.total || 0;

  res.json(hospitals.map((hospital) => ({
    ...hospital.toObject(),
    stock: Math.max(0, Math.round(fallbackStock / Math.max(hospitals.length, 1)))
  })));
});

const createHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.create(hospitalInput(req.body));
  res.status(201).json({ ...hospital.toObject(), stock: 0 });
});

const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(objectId(req.params.id), hospitalInput(req.body), {
    new: true,
    runValidators: true
  });
  if (!hospital) return res.status(404).json({ message: "Hospital not found" });
  res.json(hospital);
});

const deleteHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndDelete(objectId(req.params.id));
  if (!hospital) return res.status(404).json({ message: "Hospital not found" });
  res.json({ message: "Hospital deleted" });
});

module.exports = { getHospitals, createHospital, updateHospital, deleteHospital };
