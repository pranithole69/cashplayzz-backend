// server/routes/deposit.js
const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const authenticateUser = require("../middleware/auth"); // ✅ use this (your middleware file)

// POST /api/deposit (Authenticated)
router.post("/", authenticateUser, async (req, res) => {
  const { amount, transactionId, senderName } = req.body;

  if (!amount || !transactionId || !senderName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const deposit = new Deposit({
      user: req.user._id, // ✅ the id added by middleware
      amount,
      transactionId,
      senderName,
    });

    await deposit.save();
    res.status(201).json({ message: "Deposit submitted", deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
