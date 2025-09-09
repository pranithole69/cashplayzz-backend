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
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/tournaments - Get all tournaments with joined boolean
router.get('/tournaments', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const mode = req.query.mode;
    const filter = mode ? { teamType: mode } : {};

    const tournaments = await Tournament.find(filter);

    // CRITICAL FIX: Handle both old string format and new object format
    let joinedIds = [];
    if (Array.isArray(user.joinedMatches)) {
      joinedIds = user.joinedMatches.map(jm => {
        // Handle both old string format and new object format
        if (typeof jm === 'string') return jm;
        return jm && jm.matchId ? jm.matchId.toString() : null;
      }).filter(id => id !== null);
    }

    console.log('User joined match IDs:', joinedIds); // Debug log

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

    console.log(`User has ${user.joinedMatches.length} joined matches`);

    const joinedMatchesData = [];

    for (const jm of user.joinedMatches) {
      let matchId;
      
      // Handle both old string format and new object format
      if (typeof jm === 'string') {
        matchId = jm;
      } else if (jm && jm.matchId) {
        matchId = jm.matchId;
      } else {
        continue;
      }

      const match = await Tournament.findById(matchId);
      if (match) {
        joinedMatchesData.push({
          id: match._id,
          teamType: match.teamType,
          squadSize: match.squadSize,
          entryFee: match.entryFee,
          prizePool: match.prizePool,
          matchTime: match.matchTime,
          roomId: (typeof jm === 'object' ? jm.roomId : '') || '',
          roomPassword: (typeof jm === 'object' ? jm.roomPassword : '') || '',
          players: match.players,
          maxPlayers: match.maxPlayers,
          rules: match.rules || [],
        });
      }
    }

    console.log(`Returning ${joinedMatchesData.length} joined matches`);
    res.json(joinedMatchesData);
  } catch (err) {
    console.error('Error fetching joined matches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/join-match - Join a tournament (FIXED VERSION)
router.post('/join-match', verifyToken, async (req, res) => {
  const { matchId, entryFee } = req.body;

  console.log(`Join attempt: User ${req.user.id}, Match ${matchId}, Fee ${entryFee}`);

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < entryFee) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check if already joined (handle both old and new formats)
    const alreadyJoined = user.joinedMatches.some(jm => {
      if (typeof jm === 'string') return jm === matchId;
      return jm && jm.matchId && jm.matchId.toString() === matchId;
    });

    if (alreadyJoined) {
      return res.status(400).json({ message: 'Already joined this match' });
    }

    const match = await Tournament.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Tournament not found' });

    // CRITICAL FIX: Store as proper object with schema structure
    user.balance -= entryFee;
    user.joinedMatches.push({
      matchId: matchId,
      joinedAt: new Date(),
      status: 'upcoming',
      startTime: match.matchTime,
      roomId: '',
      roomPassword: '',
    });

    const savedUser = await user.save();
    console.log(`Successfully saved user with ${savedUser.joinedMatches.length} joined matches`);

    res.json({ success: true, balance: savedUser.balance });
  } catch (err) {
    console.error('Error joining match:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
