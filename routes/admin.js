// routes/admin.js
const express = require('express');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Dashboard with ALL Statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      // Tournament Stats
      tournaments: {
        total: await Tournament.countDocuments(),
        today: await Tournament.countDocuments({
          matchTime: { $gte: today, $lt: tomorrow }
        }),
        battleRoyale: await Tournament.countDocuments({ gameMode: 'battle-royale' }),
        clashSquad: await Tournament.countDocuments({ gameMode: 'clash-squad' }),
        loneWolf: await Tournament.countDocuments({ gameMode: 'lone-wolf' }),
        live: await Tournament.countDocuments({ status: 'live' }),
        upcoming: await Tournament.countDocuments({ status: 'upcoming' })
      },

      // User Stats
      users: {
        total: await User.countDocuments({ role: 'user' }),
        active: await User.countDocuments({ isActive: true }),
        newToday: await User.countDocuments({
          createdAt: { $gte: today, $lt: tomorrow }
        })
      },

      // Deposit Stats
      deposits: {
        pending: await Deposit.countDocuments({ status: 'pending' }),
        approved: await Deposit.countDocuments({ status: 'approved' }),
        rejected: await Deposit.countDocuments({ status: 'rejected' }),
        totalAmount: await Deposit.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      },

      // Withdrawal Stats
      withdrawals: {
        pending: await Withdraw.countDocuments({ status: 'pending' }),
        approved: await Withdraw.countDocuments({ status: 'approved' }),
        rejected: await Withdraw.countDocuments({ status: 'rejected' }),
        totalAmount: await Withdraw.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      }
    };

    res.json({
      success: true,
      stats: {
        ...stats,
        deposits: {
          ...stats.deposits,
          totalAmount: stats.deposits.totalAmount[0]?.total || 0
        },
        withdrawals: {
          ...stats.withdrawals,
          totalAmount: stats.withdrawals.totalAmount[0]?.total || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Tournament with ALL Fields
router.post('/tournaments', adminAuth, async (req, res) => {
  try {
    const {
      teamType, entryFee, maxPlayers, matchTime, gameMode,
      roomId, roomPassword, customRules, description
    } = req.body;
    
    // Auto-calculate with 22% profit
    const totalCollection = entryFee * maxPlayers;
    const profit = Math.round(totalCollection * 0.22);
    const prizePool = totalCollection - profit;
    
    const tournament = new Tournament({
      teamType,
      entryFee,
      maxPlayers,
      matchTime: new Date(matchTime),
      gameMode, // battle-royale, clash-squad, lone-wolf
      prizePool,
      prizes: {
        first: Math.round(prizePool * 0.5),
        second: Math.round(prizePool * 0.3),
        third: Math.round(prizePool * 0.2)
      },
      roomId: roomId || `ROOM${Date.now()}`,
      roomPassword: roomPassword || `PASS${Math.random().toString(36).substr(2, 8)}`,
      rules: customRules || getDefaultRules(gameMode),
      description,
      createdBy: req.user.id
    });
    
    await tournament.save();
    
    // Broadcast to clients
    req.app.get('io').emit('tournament-created', tournament);
    
    res.json({
      success: true,
      tournament,
      profit: profit,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ALL Deposits with User Info
router.get('/deposits', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    
    if (status && status !== 'all') filter.status = status;
    
    const deposits = await Deposit.find(filter)
      .populate('userId', 'username email balance totalDeposits')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Deposit.countDocuments(filter);
    
    res.json({
      success: true,
      deposits,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ALL Withdrawals with User Info
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    
    if (status && status !== 'all') filter.status = status;
    
    const withdrawals = await Withdraw.find(filter)
      .populate('userId', 'username email balance totalWithdrawals')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Withdraw.countDocuments(filter);
    
    res.json({
      success: true,
      withdrawals,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve/Reject Deposit (Credits wallet ONLY when approved)
router.put('/deposits/:id/:action', adminAuth, async (req, res) => {
  try {
    const { id, action } = req.params;
    const { adminNotes } = req.body;
    
    const deposit = await Deposit.findById(id).populate('userId');
    
    if (!deposit) {
      return res.status(404).json({ success: false, error: 'Deposit not found' });
    }
    
    if (deposit.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Deposit already processed' 
      });
    }
    
    const user = deposit.userId;
    
    if (action === 'approve') {
      // CREDIT wallet ONLY when admin approves
      user.balance += deposit.amount;
      user.totalDeposits = (user.totalDeposits || 0) + deposit.amount;
      deposit.status = 'approved';
    } else if (action === 'reject') {
      deposit.status = 'rejected';
    }
    
    deposit.adminNotes = adminNotes;
    deposit.processedBy = req.user.id;
    deposit.processedAt = new Date();
    
    await Promise.all([deposit.save(), user.save()]);
    
    // Notify user in real-time
    const io = req.app.get('io');
    io.to(`user_${user._id}`).emit('deposit-updated', {
      status: deposit.status,
      amount: deposit.amount,
      newBalance: user.balance,
      message: `Your deposit of ₹${deposit.amount} has been ${deposit.status}`
    });
    
    res.json({
      success: true,
      message: `Deposit ${deposit.status} successfully`,
      deposit,
      newUserBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve/Reject Withdrawal (Debits wallet ONLY when approved)
router.put('/withdrawals/:id/:action', adminAuth, async (req, res) => {
  try {
    const { id, action } = req.params;
    const { adminNotes } = req.body;
    
    const withdrawal = await Withdraw.findById(id).populate('userId');
    
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Withdrawal already processed' 
      });
    }
    
    const user = withdrawal.userId;
    
    if (action === 'approve') {
      // Check sufficient balance
      if (user.balance < withdrawal.amount) {
        return res.status(400).json({
          success: false,
          error: 'User has insufficient balance'
        });
      }
      
      // DEBIT wallet ONLY when admin approves
      user.balance -= withdrawal.amount;
      user.totalWithdrawals = (user.totalWithdrawals || 0) + withdrawal.amount;
      withdrawal.status = 'approved';
    } else if (action === 'reject') {
      withdrawal.status = 'rejected';
    }
    
    withdrawal.adminNotes = adminNotes;
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    
    await Promise.all([withdrawal.save(), user.save()]);
    
    // Notify user in real-time
    const io = req.app.get('io');
    io.to(`user_${user._id}`).emit('withdrawal-updated', {
      status: withdrawal.status,
      amount: withdrawal.amount,
      newBalance: user.balance,
      message: `Your withdrawal of ₹${withdrawal.amount} has been ${withdrawal.status}`
    });
    
    res.json({
      success: true,
      message: `Withdrawal ${withdrawal.status} successfully`,
      withdrawal,
      newUserBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ALL Tournaments with Complete Details
router.get('/tournaments', adminAuth, async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('joinedPlayers', 'username email balance')
      .populate('createdBy', 'username email')
      .sort({ matchTime: 1 });
    
    const enrichedTournaments = tournaments.map(tournament => ({
      ...tournament.toObject(),
      playerCount: tournament.joinedPlayers?.length || 0,
      profit: Math.round(tournament.entryFee * tournament.maxPlayers * 0.22),
      totalCollection: tournament.entryFee * tournament.maxPlayers,
      fillPercentage: Math.round((tournament.joinedPlayers?.length || 0) / tournament.maxPlayers * 100),
      timeRemaining: tournament.matchTime > new Date() ? 
        Math.ceil((tournament.matchTime - new Date()) / (1000 * 60)) : 0
    }));

    res.json({
      success: true,
      tournaments: enrichedTournaments
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function for default rules based on game mode
function getDefaultRules(gameMode) {
  const rules = {
    'battle-royale': [
      'No teaming in solo matches',
      'Classic Battle Royale mode only',
      'Use of hacks/cheats will result in immediate ban',
      'Match starts exactly at scheduled time',
      'Winners announced within 30 minutes',
      'Submit results with screenshots'
    ],
    'clash-squad': [
      'Teams of 4 players max',
      'Clash Squad mode only',
      'Fair play competition required',
      'No stream sniping allowed',
      'Room details shared 5 minutes before match',
      'Prize distribution: 1st (50%), 2nd (30%), 3rd (20%)'
    ],
    'lone-wolf': [
      'Solo players only',
      'Lone Wolf survival mode',
      'No external assistance allowed',
      'Standard game rules apply',
      'Results verified by admin',
      'Immediate disqualification for rule violations'
    ]
  };
  return rules[gameMode] || rules['battle-royale'];
}

module.exports = router;
