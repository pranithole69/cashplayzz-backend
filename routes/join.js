const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

router.post('/join-match', verifyToken, async (req, res) => {
  try {
    const { entryFee, matchId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (typeof entryFee !== "number" || entryFee <= 0) {
      return res.status(400).json({ message: "Valid entry fee is required." });
    }

    if (user.balance < entryFee)
      return res.status(400).json({ message: "Insufficient balance." });

    user.balance -= entryFee;
    user.totalWagered += entryFee;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Joined match! ₹${entryFee} deducted.`,
      balance: user.balance,
    });
  } catch (err) {
    console.error("Join error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
