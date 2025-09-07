const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tournament = require('../models/Tournament'); // Your Tournament model
const { verifyToken } = require('../middleware/auth');

router.post('/join-match', verifyToken, async (req, res) => {
  try {
    const { entryFee, matchId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Prevent duplicate join
    if (user.joinedMatches && user.joinedMatches.includes(matchId)) {
      return res.status(400).json({ message: "Already joined this match." });
    }

    if (typeof entryFee !== "number" || entryFee <= 0) {
      return res.status(400).json({ message: "Valid entry fee required." });
    }

    if (user.balance < entryFee)
      return res.status(400).json({ message: "Insufficient balance." });

    user.balance -= entryFee;
    user.totalWagered += entryFee;

    if (!user.joinedMatches) user.joinedMatches = [];
    user.joinedMatches.push(matchId);

    await user.save();

    res.status(200).json({
      success: true,
      message: `Joined match! ₹${entryFee} deducted.`,
      balance: user.balance,
      joinedMatches: user.joinedMatches,
    });
  } catch (err) {
    console.error("Join error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
