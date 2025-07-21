const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth"); // ✅ fixed

router.post("/", verifyToken, async (req, res) => {
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
