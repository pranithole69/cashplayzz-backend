const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const User = require('../models/User');

// 📥 POST /api/user/deposit
router.post('/deposit', auth, async (req, res) => {
  const { amount, method, upiRef } = req.body;

  if (!amount || !method || !upiRef) {
    return res.status(400).json({ error: "All fields required." });
  }

  try {
    const tx = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount,
      method,
      upiRef,
      status: 'pending' // ❗Important: Only admin will approve this
    });

    res.json({ message: 'Deposit request submitted. Awaiting admin approval.', tx });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 📤 POST /api/user/withdraw
router.post('/withdraw', auth, async (req, res) => {
  const { amount, upiRef } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const tx = await Transaction.create({
      userId: req.user._id,
      type: 'withdraw',
      amount,
      upiRef,
      status: 'pending'
    });

    res.json({ message: 'Withdraw request submitted. Awaiting admin approval.', tx });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
