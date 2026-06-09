require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedData = require("./utils/seedData");
const authRoutes = require("./routes/authRoutes");
const donorRoutes = require("./routes/donorRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const stockRoutes = require("./routes/stockRoutes");
const requestRoutes = require("./routes/requestRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);

  const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (isLocalDevOrigin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked origin: ${origin}`));
}

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/blood-stock", stockRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

const frontendRoot = path.join(__dirname, "..");

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendRoot, "index.html"));
});

app.get(["/index.html", "/styles.css", "/app.js", "/logo.svg"], (req, res) => {
  res.sendFile(path.join(frontendRoot, req.path.slice(1)));
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendRoot, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    await seedData();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

start();
