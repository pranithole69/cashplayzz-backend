const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Tournament = require('../models/Tournament'); // Your actual Tournament model

// GET /api/user/tournaments -- should return all tournaments with joined flags
router.get('/user/tournaments', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const tournaments = await Tournament.find({}); // get all tournaments from DB

    const joinedSet = new Set(
      (user.joinedMatches || []).map(id => id.toString())
    );

    // Map backend _id to id so frontend can use id field
    const combined = tournaments.map(t => ({
      id: t._id.toString(),
      ...t.toObject(),
      joined: joinedSet.has(t._id.toString()),
    }));

    res.json(combined);
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
