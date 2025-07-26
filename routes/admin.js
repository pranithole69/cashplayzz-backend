const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require("../models/User");
const auth = require('../middleware/auth');

// ✅ Middleware to check admin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  next();
}

// ✅ GET all deposit requests
router.get('/deposits', auth.verifyToken, isAdmin, async (req, res) => {
  const deposits = await Transaction.find({ type: 'deposit' }).populate('userId', 'username email');
  res.json(deposits);
});

// ✅ GET all withdrawal requests
router.get('/withdrawals', auth.verifyToken, isAdmin, async (req, res) => {
 const withdrawals = await Transaction.find({ type: 'withdraw' }).populate('userId', 'username email');
  res.json(withdrawals);
});

// ✅ Approve transaction
router.put('/approve/:id', auth.verifyToken, isAdmin, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx || tx.status !== 'pending') return res.status(400).json({ error: 'Invalid transaction' });

  const user = await User.findById(tx.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (tx.type === 'deposit') {
    user.balance += tx.amount;
    user.totalDeposits += tx.amount;
  } else if (tx.type === 'withdraw') {
    if (user.balance < tx.amount) return res.status(400).json({ error: 'Insufficient balance' });
    user.balance -= tx.amount;
    user.totalWithdrawals += tx.amount;
  }

  tx.status = 'approved';
  await tx.save();
  await user.save();

  res.json({ message: `${tx.type} approved`, tx });
});

// ✅ Reject transaction
router.put('/reject/:id', auth.verifyToken, isAdmin, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx || tx.status !== 'pending') return res.status(400).json({ error: 'Invalid transaction' });

  tx.status = 'rejected';
  await tx.save();

  res.json({ message: `${tx.type} rejected`, tx });
});

// 📊 Main Admin Stats (with top winner & loser)
router.get('/stats', auth.verifyToken, isAdmin, async (req, res) => {
  const users = await User.find();

  let totalWagered = 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let topWinner = null;
  let topLoser = null;

  for (const u of users) {
    totalWagered += u.totalWagered || 0;
    totalDeposits += u.totalDeposits || 0;
    totalWithdrawals += u.totalWithdrawals || 0;

    if (!topWinner || u.totalWin > topWinner.totalWin) topWinner = u;
    if (!topLoser || u.totalLoss > topLoser.totalLoss) topLoser = u;
  }

  res.json({
    totalWagered,
    totalDeposits,
    totalWithdrawals,
    profit: totalDeposits - totalWithdrawals,
    totalUsers: users.length,
    topWinner: topWinner ? { username: topWinner.username, amount: topWinner.totalWin } : null,
    topLoser: topLoser ? { username: topLoser.username, amount: topLoser.totalLoss } : null,
  });
});

module.exports = router;
