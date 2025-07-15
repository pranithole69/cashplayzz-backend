const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// ✅ Use express.json for parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS setup (allow frontend)
app.use(cors({
  origin: ["http://localhost:5173", "https://cashplayzz.surge.sh"],
  credentials: true,
}));

// ✅ Debug middleware
app.use((req, res, next) => {
  console.log(`🛬 ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ❌ DO NOT SERVE CLIENT HERE ON RENDER
// ❌ REMOVE THIS PART (causes the dist/index.html error):
// const path = require("path");
// const __dirnamePath = path.resolve();
// const buildPath = path.join(__dirnamePath, "client", "dist");
// app.use(express.static(buildPath));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(buildPath, "index.html"));
// });

// ✅ Default route
app.get("/", (req, res) => {
  res.send("✅ CashPlayzz Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
