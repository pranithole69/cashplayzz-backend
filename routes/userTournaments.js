const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tournament = require('../models/Tournament'); // Your Tournament Mongoose model
const { verifyToken } = require('../middleware/auth');

router.get('/user/tournaments', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Fetch tournaments from your database
    const tournaments = await Tournament.find({});

    // Convert user's joinedMatches to a Set of strings for quick lookup
    const joinedSet = new Set(
      (user.joinedMatches || []).map(id => id.toString())
    );

    // Mark tournaments the user has joined
    const combined = tournaments.map(tourney => {
      return {
        ...tourney.toObject(),
        joined: joinedSet.has(tourney._id.toString()),
      };
    });

    res.json(combined);
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
