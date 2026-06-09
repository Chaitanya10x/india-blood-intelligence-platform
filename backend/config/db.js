const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB Atlas connected");
}

module.exports = connectDB;
