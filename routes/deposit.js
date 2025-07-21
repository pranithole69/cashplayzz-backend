// server/routes/deposit.js
const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const auth = require("../middleware/auth");

// POST /api/deposit - Submit deposit request
router.post("/", auth, async (req, res) => {
  try {
    const { amount, transactionId, senderName } = req.body;

    if (!amount || !transactionId || !senderName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newDeposit = new Deposit({
      user: req.user.id,
      amount,
      transactionId,
      senderName,
    });

    await newDeposit.save();

    res.status(201).json({ message: "Deposit request submitted", deposit: newDeposit });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
