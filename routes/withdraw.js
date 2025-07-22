// routes/withdraw.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const User = require("../models/User");
const Withdraw = require("../models/Withdraw");

// POST /api/withdraw
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, upiId } = req.body;

    // 1. Validate required fields
    if (!amount || !upiId) {
      return res.status(400).json({ message: "Amount and UPI ID are required." });
    }

    // 2. Validate minimum amount
    if (amount < 10) {
      return res.status(400).json({ message: "Minimum withdrawal amount is ₹10." });
    }

    // 3. Check if user exists and has enough balance
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    // 4. Count today's withdrawals
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayWithdrawals = await Withdraw.countDocuments({
      user: userId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    if (todayWithdrawals >= 4) {
      return res.status(400).json({ message: "Withdrawal limit (4 per day) reached." });
    }

    // 5. Create withdraw entry
    const newWithdraw = new Withdraw({
      user: userId,
      amount,
      upiId,
    });

    await newWithdraw.save();

    // 6. Update user's balance and totalWithdrawals
    user.balance -= amount;
    user.totalWithdrawals += amount;
    await user.save();

    res.status(200).json({ message: "Withdrawal request submitted." });
  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
