const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

// GET /api/user/profile - Get user profile info
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user); // send user data as JSON
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/tournaments - Get all tournaments with joined boolean
router.get('/tournaments', verifyToken, async (req, res) => {
  try {
    const tournaments = await Tournament.find({});
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let joinedIds = [];
    if (Array.isArray(user.joinedMatches)) {
      joinedIds = user.joinedMatches
        .map(jm => (jm && jm.matchId ? jm.matchId.toString() : ""))
        .filter(id => id);
    }

    const tournamentsWithJoinState = tournaments.map(t => ({
      ...t.toObject(),
      joined: joinedIds.includes(t._id.toString()),
    }));

    res.json(tournamentsWithJoinState);
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/joined-matches - Get all joined matches for user
router.get('/joined-matches', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = Date.now();
    const joinedMatchesData = [];

    for (const jm of user.joinedMatches) {
      if (!jm || !jm.matchId) continue;  // Defensive check
      const match = await Tournament.findById(jm.matchId);
      if (match) {
        const startTimeMs = new Date(match.matchTime).getTime();
        if (now < startTimeMs + 3600000) {
          joinedMatchesData.push({
            id: match._id,
            mode: match.mode,
            teamType: match.teamType,
            squadSize: match.squadSize,
            entryFee: match.entryFee,
            prizePool: match.prizePool,
            matchTime: match.matchTime,
            roomId: jm.roomId || match.roomId || '',
            roomPassword: jm.roomPassword || match.roomPassword || '',
            players: match.players,
            maxPlayers: match.maxPlayers,
            rules: match.rules || [],
          });
        }
      }
    }

    res.json(joinedMatchesData);
  } catch (err) {
    console.error('Error fetching joined matches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/join-match - Join a tournament
router.post('/join-match', verifyToken, async (req, res) => {
  const { matchId, entryFee } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < entryFee) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (user.joinedMatches.some(jm => jm && jm.matchId && jm.matchId.toString() === matchId)) {
      return res.status(400).json({ message: 'Already joined this match' });
    }

    const match = await Tournament.findById(matchId);
    const matchStartTime = match ? match.matchTime : null;

    user.balance -= entryFee;
    user.joinedMatches.push({
      matchId,
      joinedAt: new Date(),
      status: 'upcoming',
      startTime: matchStartTime,
    });

    await user.save();

    res.json({ success: true, balance: user.balance });
  } catch (err) {
    console.error('Error joining match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
