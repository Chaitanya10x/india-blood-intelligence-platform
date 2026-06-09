const User = require("../models/User");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const BloodStock = require("../models/BloodStock");
const BloodRequest = require("../models/BloodRequest");

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const stockColors = {
  "A+": "#ff1628",
  "A-": "#1897d5",
  "B+": "#ff8f00",
  "B-": "#7755d9",
  "AB+": "#19c796",
  "AB-": "#d821c8",
  "O+": "#ffae23",
  "O-": "#ff344b"
};

const stateCities = [
  { state: "Delhi", city: "Delhi", areas: ["Ansari Nagar", "Karol Bagh", "Saket", "Dwarka"] },
  { state: "Maharashtra", city: "Mumbai", areas: ["Parel", "Bandra", "Andheri", "Dadar"] },
  { state: "Maharashtra", city: "Pune", areas: ["Shivajinagar", "Hadapsar", "Kothrud", "Aundh"] },
  { state: "Karnataka", city: "Bengaluru", areas: ["Fort Road", "Whitefield", "Indiranagar", "Jayanagar"] },
  { state: "Telangana", city: "Hyderabad", areas: ["Afzal Gunj", "Banjara Hills", "Madhapur", "Secunderabad"] },
  { state: "Tamil Nadu", city: "Chennai", areas: ["Park Town", "Adyar", "T Nagar", "Velachery"] },
  { state: "Gujarat", city: "Ahmedabad", areas: ["Asarwa", "Navrangpura", "Maninagar", "Satellite"] },
  { state: "Rajasthan", city: "Jaipur", areas: ["C Scheme", "Malviya Nagar", "Vaishali Nagar", "Tonk Road"] },
  { state: "West Bengal", city: "Kolkata", areas: ["Salt Lake", "Park Street", "Howrah", "Ballygunge"] },
  { state: "Uttar Pradesh", city: "Lucknow", areas: ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar"] }
];

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Ananya", "Diya", "Myra", "Aadhya", "Aarohi", "Saanvi", "Ira", "Prisha", "Meera", "Kiara"
];
const lastNames = ["Sharma", "Patel", "Reddy", "Khan", "Iyer", "Singh", "Gupta", "Nair", "Mehta", "Joshi"];
const hospitalPrefixes = ["Apollo", "Fortis", "CityCare", "Lifeline", "Metro", "Medanta", "Sanjeevani", "CarePlus", "Apex", "Noble"];

function pick(list, index) {
  return list[index % list.length];
}

function monthsAgo(index) {
  const date = new Date();
  date.setMonth(date.getMonth() - (index % 8));
  date.setDate(2 + (index % 24));
  date.setHours(9 + (index % 10), 15, 0, 0);
  return date;
}

function donorRecord(index) {
  const location = pick(stateCities, index);
  return {
    name: `${pick(firstNames, index)} ${pick(lastNames, index * 3)}`,
    bloodGroup: pick(bloodGroups, index * 5),
    city: location.city,
    state: location.state,
    phone: `+91 9${String(100000000 + index * 7919).slice(0, 9)}`,
    lastDonationDate: monthsAgo(index),
    isActive: index % 11 !== 0,
    createdAt: monthsAgo(index + 1),
    updatedAt: monthsAgo(index)
  };
}

function hospitalRecord(index) {
  const location = pick(stateCities, index);
  return {
    name: `${pick(hospitalPrefixes, index)} ${location.city} Hospital ${index + 1}`,
    area: pick(location.areas, index),
    city: location.city,
    state: location.state,
    status: index % 13 === 0 ? "Disconnected" : "Connected",
    contactPhone: `+91 8${String(200000000 + index * 3571).slice(0, 9)}`,
    createdAt: monthsAgo(index + 2),
    updatedAt: monthsAgo(index)
  };
}

function requestRecord(index, hospitals) {
  const hospital = pick(hospitals, index);
  const isEmergency = index % 6 === 0 || pick(bloodGroups, index) === "O-";
  const statuses = isEmergency ? ["Pending", "Accepted", "Pending", "Completed"] : ["Pending", "Accepted", "Completed", "Rejected"];
  return {
    patient: `${pick(firstNames, index + 4)} ${pick(lastNames, index + 7)}`,
    bloodGroup: pick(bloodGroups, index * 7),
    units: 1 + (index % 4),
    hospital: hospital.name,
    state: hospital.state,
    isEmergency,
    status: pick(statuses, index),
    price: (1 + (index % 4)) * 2400,
    createdAt: monthsAgo(index),
    updatedAt: monthsAgo(index)
  };
}

async function ensureAdmin() {
  if ((await User.countDocuments()) > 0) return;
  await User.create({
    name: "Chaitanya",
    email: "admin@eblood.local",
    password: "password123",
    role: "admin"
  });
}

async function ensureStock() {
  const targets = {
    "A+": 1120,
    "A-": 420,
    "B+": 980,
    "B-": 360,
    "AB+": 610,
    "AB-": 260,
    "O+": 1560,
    "O-": 310
  };

  await Promise.all(Object.entries(targets).map(([group, units]) => BloodStock.findOneAndUpdate(
    { group },
    {
      group,
      units,
      color: stockColors[group],
      lowStockThreshold: group.includes("-") ? 350 : 500
    },
    { upsert: true, runValidators: true }
  )));
}

async function ensureDonors() {
  const donorCount = await Donor.countDocuments();
  if (donorCount >= 100) return;

  const needed = 120 - donorCount;
  const start = donorCount;
  await Donor.insertMany(Array.from({ length: needed }, (_, offset) => donorRecord(start + offset)));
}

async function ensureHospitals() {
  const hospitalCount = await Hospital.countDocuments();
  if (hospitalCount >= 25) return;

  const needed = 30 - hospitalCount;
  const start = hospitalCount;
  await Hospital.insertMany(Array.from({ length: needed }, (_, offset) => hospitalRecord(start + offset)), { ordered: false });
}

async function ensureRequests() {
  const requestCount = await BloodRequest.countDocuments();
  if (requestCount >= 80) return;

  const hospitals = await Hospital.find().sort({ createdAt: 1 });
  if (hospitals.length === 0) return;

  const needed = 90 - requestCount;
  const start = requestCount;
  await BloodRequest.insertMany(Array.from({ length: needed }, (_, offset) => requestRecord(start + offset, hospitals)));
}

async function seedData() {
  await ensureAdmin();
  await ensureStock();
  await ensureHospitals();
  await ensureDonors();
  await ensureRequests();
}

module.exports = seedData;
