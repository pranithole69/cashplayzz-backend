const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'Username and password are required' });

    const user = await User.findOne({ $or: [{ email: username }, { username }] });
    if (!user || user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Unauthorized' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, username: user.username } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ADMIN DASHBOARD STATS
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0));
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const stats = {
      tournaments: {
        total: await Tournament.countDocuments(),
        today: await Tournament.countDocuments({ matchTime: { $gte: todayStart, $lt: tomorrowStart } }),
        battleRoyale: await Tournament.countDocuments({ gameMode: 'battle-royale' }),
        clashSquad: await Tournament.countDocuments({ gameMode: 'clash-squad' }),
        loneWolf: await Tournament.countDocuments({ gameMode: 'lone-wolf' }),
        live: await Tournament.countDocuments({ status: 'live' }),
        upcoming: await Tournament.countDocuments({ status: 'upcoming' }),
      },
      users: {
        total: await User.countDocuments({ role: 'user' }),
        active: await User.countDocuments({ isActive: true }),
        newToday: await User.countDocuments({ createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
      },
      deposits: {
        pending: await Deposit.countDocuments({ status: 'pending' }),
        approved: await Deposit.countDocuments({ status: 'approved' }),
        rejected: await Deposit.countDocuments({ status: 'rejected' }),
        totalAmount: (await Deposit.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0,
      },
      withdrawals: {
        pending: await Withdraw.countDocuments({ status: 'pending' }),
        approved: await Withdraw.countDocuments({ status: 'approved' }),
        rejected: await Withdraw.countDocuments({ status: 'rejected' }),
        totalAmount: (await Withdraw.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total || 0,
      },
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// GET ALL TOURNAMENTS
router.get('/tournaments', adminAuth, async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ matchTime: 1 });
    res.json({ success: true, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tournaments' });
  }
});

// CREATE TOURNAMENT
router.post('/tournaments', adminAuth, async (req, res) => {
  try {
    const data = req.body;
    data.matchTime = new Date(data.matchTime);
    const tournament = new Tournament(data);
    await tournament.save();
    res.status(201).json({ success: true, tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to create tournament' });
  }
});

// UPDATE TOURNAMENT
router.put('/tournaments/:id', adminAuth, async (req, res) => {
  try {
    const data = req.body;
    if (data.matchTime) data.matchTime = new Date(data.matchTime);
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!tournament) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to update tournament' });
  }
});

// DELETE TOURNAMENT
router.delete('/tournaments/:id', adminAuth, async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to delete tournament' });
  }
});

// GET ALL USERS
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET ALL DEPOSITS
router.get('/deposits', adminAuth, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let filter = {};
    if (status !== 'all') filter.status = status;

    const deposits = await Deposit.find(filter).populate('userId').sort({ createdAt: -1 });
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch deposits' });
  }
});

// APPROVE/REJECT DEPOSIT
router.put('/deposits/:id/:action', adminAuth, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate('userId');
    if (!deposit) return res.status(404).json({ success: false, error: 'Not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ success: false, error: 'Already processed' });

    const { adminNotes } = req.body;
    if (req.params.action === 'approve') {
      deposit.status = 'approved';
      deposit.userId.balance += deposit.amount;
    } else if (req.params.action === 'reject') {
      deposit.status = 'rejected';
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    deposit.adminNotes = adminNotes;
    deposit.processedAt = new Date();
    await Promise.all([deposit.save(), deposit.userId.save()]);

    res.json({ success: true, deposit, newUserBalance: deposit.userId.balance });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Action failed' });
  }
});

// GET ALL WITHDRAWALS
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let filter = {};
    if (status !== 'all') filter.status = status;

    const withdrawals = await Withdraw.find(filter).populate('userId').sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
  }
});

// APPROVE/REJECT WITHDRAWAL
router.put('/withdrawals/:id/:action', adminAuth, async (req, res) => {
  try {
    const withdrawal = await Withdraw.findById(req.params.id).populate('userId');
    if (!withdrawal) return res.status(404).json({ success: false, error: 'Not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ success: false, error: 'Already processed' });

    const { adminNotes } = req.body;
    if (req.params.action === 'approve') {
      if (withdrawal.userId.balance < withdrawal.amount) {
        return res.status(400).json({ success: false, error: 'Insufficient balance' });
      }
      withdrawal.status = 'approved';
      withdrawal.userId.balance -= withdrawal.amount;
    } else if (req.params.action === 'reject') {
      withdrawal.status = 'rejected';
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    withdrawal.adminNotes = adminNotes;
    withdrawal.processedAt = new Date();
    await Promise.all([withdrawal.save(), withdrawal.userId.save()]);

    res.json({ success: true, withdrawal, newUserBalance: withdrawal.userId.balance });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Action failed' });
  }
});

module.exports = router;
