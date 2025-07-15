const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: ["http://localhost:5173", "https://cashplayzz.surge.sh"],
  credentials: true
}));
app.use(express.json());

// ✅ Debug logs for backend requests
app.use((req, res, next) => {
  console.log(`🛬 ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// ✅ MongoDB connect
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});

// ✅ Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Basic root route (optional)
app.get("/", (req, res) => {
  res.send("🚀 CashPlayzz Backend is Live!");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
