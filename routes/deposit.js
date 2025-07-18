// server/routes/deposit.js
const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // if user model is used

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// POST /api/deposit
router.post("/", authenticateToken, async (req, res) => {
  const { amount, transactionId, senderName } = req.body;

  if (!amount || !transactionId || !senderName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const deposit = new Deposit({
      user: req.user.id,
      amount,
      transactionId,
      senderName
    });

    await deposit.save();
    res.status(201).json({ message: "Deposit submitted", deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
