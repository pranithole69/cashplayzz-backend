const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ===== MIDDLEWARES =====
app.use(cors());
app.use(express.json());

// ===== MONGODB CONNECTION =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== API ROUTES =====
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", require("./routes/admin"));

// ===== DEFAULT ROUTE =====
app.get("/", (req, res) => {
  res.send("✅ CashPlayzz backend is running!");
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
