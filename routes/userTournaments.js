const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tournaments with joined flag
router.get('/tournaments', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const mode = req.query.mode;
    const filter = mode ? { teamType: mode } : {};

    const tournaments = await Tournament.find(filter);

    const joinedIds = (user.joinedMatches || []).map(jm => jm.matchId.toString());

    const tournamentsWithJoin = tournaments.map(t => ({
      ...t.toObject(),
      joined: joinedIds.includes(t._id.toString()),
    }));

    res.json(tournamentsWithJoin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get joined matches for dashboard
router.get('/joined-matches', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = Date.now();
    const joinedMatches = [];

    for (const jm of user.joinedMatches) {
      if (!jm?.matchId) continue;
      const tournament = await Tournament.findById(jm.matchId);
      if (!tournament) continue;
      const startTimeMs = new Date(tournament.matchTime).getTime();

      if (now < startTimeMs + 3600000) {
        joinedMatches.push({
          id: tournament._id,
          teamType: tournament.teamType,
          squadSize: tournament.squadSize,
          entryFee: tournament.entryFee,
          prizePool: tournament.prizePool,
          matchTime: tournament.matchTime,
          roomId: jm.roomId || tournament.roomId || '',
          roomPassword: jm.roomPassword || tournament.roomPassword || '',
          players: tournament.players,
          maxPlayers: tournament.maxPlayers,
          rules: tournament.rules || [],
        });
      }
    }
    res.json(joinedMatches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a tournament and deduct balance
router.post('/join-match', verifyToken, async (req, res) => {
  const { entryFee, matchId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < entryFee) return res.status(400).json({ message: 'Insufficient balance' });

    if (user.joinedMatches.some(jm => jm.matchId.toString() === matchId)) {
      return res.status(400).json({ message: 'Already joined this match' });
    }

    const tournament = await Tournament.findById(matchId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    user.balance -= entryFee;
    user.joinedMatches.push({
      matchId,
      joinedAt: new Date(),
      status: 'upcoming',
      startTime: tournament.matchTime,
      roomId: '',
      roomPassword: '',
    });

    await user.save();
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
