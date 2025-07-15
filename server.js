const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Enable JSON body parsing (REQUIRED for Render + Surge!)
app.use(express.json());

// ✅ CORS (allow local + Surge frontend)
app.use(cors({
  origin: ["http://localhost:5173", "https://cashplayzz.surge.sh"],
  credentials: true,
}));

// ✅ Debug logs to see request data
app.use((req, res, next) => {
  console.log(`🛬 ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// ✅ Environment setup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ API Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Serve frontend from /client/dist in production
const __dirnamePath = path.resolve();
const buildPath = path.join(__dirnamePath, "client", "dist");

app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
