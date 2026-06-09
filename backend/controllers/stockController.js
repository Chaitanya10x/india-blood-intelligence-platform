const BloodStock = require("../models/BloodStock");
const asyncHandler = require("../utils/asyncHandler");
const { bloodGroup, numberValue, objectId } = require("../middleware/validate");

const stockColors = {
  "A+": "#ff1628",
  "B+": "#ff8f00",
  "O+": "#ffae23",
  "AB+": "#19c796",
  "A-": "#1897d5",
  "B-": "#7755d9",
  "O-": "#ff344b",
  "AB-": "#d821c8"
};

function stockInput(body) {
  const group = bloodGroup(body.group || body.bloodGroup);
  return {
    group,
    units: numberValue(body.units, "Units", 0),
    color: body.color || stockColors[group] || "#ef0f54",
    lowStockThreshold: body.lowStockThreshold !== undefined
      ? numberValue(body.lowStockThreshold, "Low stock threshold", 0)
      : 60
  };
}

const getStock = asyncHandler(async (req, res) => {
  const stock = await BloodStock.find().sort({ group: 1 });
  res.json(stock);
});

const createStock = asyncHandler(async (req, res) => {
  const input = stockInput(req.body);
  const stock = await BloodStock.findOneAndUpdate(
    { group: input.group },
    input,
    { new: true, upsert: true, runValidators: true }
  );
  res.status(201).json(stock);
});

const updateStock = asyncHandler(async (req, res) => {
  const stock = await BloodStock.findByIdAndUpdate(objectId(req.params.id), stockInput(req.body), {
    new: true,
    runValidators: true
  });
  if (!stock) return res.status(404).json({ message: "Blood stock not found" });
  res.json(stock);
});

const deleteStock = asyncHandler(async (req, res) => {
  const stock = await BloodStock.findByIdAndDelete(objectId(req.params.id));
  if (!stock) return res.status(404).json({ message: "Blood stock not found" });
  res.json({ message: "Blood stock deleted" });
});

module.exports = { getStock, createStock, updateStock, deleteStock };
