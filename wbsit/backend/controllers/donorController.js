const Donor = require("../models/Donor");
const asyncHandler = require("../utils/asyncHandler");
const { requiredString, bloodGroup, objectId } = require("../middleware/validate");

function donorInput(body) {
  return {
    name: requiredString(body.name, "Donor name"),
    bloodGroup: bloodGroup(body.bloodGroup || body.blood),
    city: requiredString(body.city, "City"),
    state: body.state ? requiredString(body.state, "State") : "Delhi",
    phone: requiredString(body.phone, "Phone number"),
    lastDonationDate: body.lastDonationDate || undefined,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
  };
}

const getDonors = asyncHandler(async (req, res) => {
  const donors = await Donor.find().sort({ createdAt: -1 });
  res.json(donors);
});

const createDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.create(donorInput(req.body));
  res.status(201).json(donor);
});

const updateDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findByIdAndUpdate(objectId(req.params.id), donorInput(req.body), {
    new: true,
    runValidators: true
  });
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  res.json(donor);
});

const deleteDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findByIdAndDelete(objectId(req.params.id));
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  res.json({ message: "Donor deleted" });
});

module.exports = { getDonors, createDonor, updateDonor, deleteDonor };
