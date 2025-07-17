const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === ✅ CORS Setup
const allowedOrigins = [
  "https://cashplayzz.surge.sh",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.options("*", cors());

// === ✅ Logger
app.use((req, res, next) => {
  console.log(`🛬 ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// === ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// === ✅ Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// === ✅ Test Route
app.get("/api/auth/test", (req, res) => {
  res.send("✅ Auth route working!");
});

// === ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
