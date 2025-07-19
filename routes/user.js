const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ✅ GET USER PROFILE
router.get('/profile', auth, async (req, res) => {
  try {
    console.log("✅ Authenticated user from token:", req.user);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ DEPOSIT ROUTE
router.post('/deposit', auth, async (req, res) => {
  const { amount, method, upiRef, senderName } = req.body;

  if (!amount || !method || !upiRef || !senderName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const tx = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount,
      method,
      upiRef,
      senderName,
      status: 'pending',
    });

    res.status(200).json({ message: 'Deposit request submitted.', tx });
  } catch (err) {
    console.error('❌ Deposit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ WITHDRAW ROUTE
router.post('/withdraw', auth, async (req, res) => {
  const { amount, upiRef } = req.body;

  if (!amount || !upiRef) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const tx = await Transaction.create({
      userId: req.user._id,
      type: 'withdraw',
      amount,
      upiRef,
      status: 'pending',
    });

    res.status(200).json({ message: 'Withdraw request submitted.', tx });
  } catch (err) {
    console.error('❌ Withdraw error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
