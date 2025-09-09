const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userTournamentsRouter = require('./routes/userTournaments');

// Load environment variables from .env
dotenv.config();

const app = express();

// ===== Middlewares =====
app.use(
  cors({
    origin: "https://cashplayzz.vercel.app", // <-- Your frontend URL here
    credentials: true,
  })
);

app.use(express.json());

// ===== Basic Test Route =====
app.get("/", (req, res) => {
  res.send("💸 CashPlayzz Backend Running");
});

// ===== Import Routes =====
// Import join route first
// Now register general user routes
app.use("/api/user", require("./routes/user"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/deposit", require("./routes/deposit"));
app.use("/api/withdraw", require("./routes/withdraw"));
app.use("/api/test", require("./routes/test")); // UptimeRobot or warmup route
app.use('/api', userTournamentsRouter);

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== Start the Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
