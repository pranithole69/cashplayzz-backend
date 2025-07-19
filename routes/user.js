const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ✅ GET user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log("✅ Authenticated user:", req.user); // Log user from token
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST deposit request
router.post('/deposit', auth, async (req, res) => {
  const { amount, method, upiRef } = req.body;

  if (!amount || !method || !upiRef) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const tx = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount,
      method,
      upiRef,
      status: 'pending',
    });

    res.json({ message: 'Deposit request submitted.', tx });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST withdraw request
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

    res.json({ message: 'Withdraw request submitted.', tx });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
