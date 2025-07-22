const express = require("express");
const router = express.Router();
const Withdraw = require("../models/Withdraw");
const authMiddleware = require("../middleware/auth");

// @route   POST /api/withdraw
// @desc    Create a new withdraw request
// @access  Private
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount, upiId } = req.body;

    if (!amount || !upiId) {
      return res.status(400).json({ msg: "Please provide amount and UPI ID" });
    }

    const newWithdraw = new Withdraw({
      userId: req.user.id,
      amount,
      upiId,
    });

    await newWithdraw.save();
    res.status(201).json({ msg: "Withdraw request submitted successfully" });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
