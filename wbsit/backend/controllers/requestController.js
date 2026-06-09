const BloodRequest = require("../models/BloodRequest");
const BloodStock = require("../models/BloodStock");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/errors");
const { requiredString, bloodGroup, numberValue, objectId } = require("../middleware/validate");

function requestInput(body) {
  return {
    patient: requiredString(body.patient || body.patientName || body.name, "Patient name"),
    bloodGroup: bloodGroup(body.bloodGroup || body.blood || body.group),
    units: numberValue(body.units, "Units", 1),
    hospital: requiredString(body.hospital, "Hospital"),
    state: body.state ? requiredString(body.state, "State") : "Delhi",
    isEmergency: body.isEmergency === true || body.isEmergency === "true" || body.priority === "Emergency",
    status: body.status || "Pending",
    price: body.price !== undefined ? numberValue(body.price, "Price", 0) : 0
  };
}

async function decrementStock(group, units) {
  const stock = await BloodStock.findOne({ group });
  if (!stock) return;
  stock.units = Math.max(0, stock.units - units);
  await stock.save();
}

const getRequests = asyncHandler(async (req, res) => {
  const requests = await BloodRequest.find().sort({ createdAt: -1 });
  res.json(requests);
});

const createRequest = asyncHandler(async (req, res) => {
  const input = requestInput(req.body);
  const request = await BloodRequest.create(input);

  if (["Accepted", "Completed"].includes(request.status)) {
    await decrementStock(request.bloodGroup, request.units);
  }

  res.status(201).json(request);
});

const updateRequest = asyncHandler(async (req, res) => {
  const input = requestInput(req.body);
  if (!["Pending", "Accepted", "Completed", "Rejected"].includes(input.status)) {
    throw new ApiError(400, "Status must be Pending, Accepted, Completed, or Rejected");
  }

  const request = await BloodRequest.findByIdAndUpdate(objectId(req.params.id), input, {
    new: true,
    runValidators: true
  });
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json(request);
});

const approveRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(objectId(req.params.id));
  if (!request) return res.status(404).json({ message: "Request not found" });

  if (request.status === "Pending") {
    request.status = "Accepted";
    await request.save();
    await decrementStock(request.bloodGroup, request.units);
  }

  res.json(request);
});

const rejectRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findByIdAndUpdate(
    objectId(req.params.id),
    { status: "Rejected" },
    { new: true, runValidators: true }
  );
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json(request);
});

const deleteRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findByIdAndDelete(objectId(req.params.id));
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json({ message: "Request deleted" });
});

module.exports = { getRequests, createRequest, updateRequest, deleteRequest, approveRequest, rejectRequest };
