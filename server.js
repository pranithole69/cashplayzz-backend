const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Log route loading
console.log("Loading route files...");

// API Routes Only (No frontend serving)
app.use("/api/auth", require("./routes/auth")); // Make sure auth.js exists
app.use("/api/user", require("./routes/user")); // User routes below
app.use("/api/admin", require("./routes/admin")); // Make sure admin.js exists

// Optional root test route
app.get("/", (req, res) => {
  res.send("✅ CashPlayzz backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
