const express = require('express');
const router = express.Router();

// Dummy auth middleware (replace with real one)
const auth = (req, res, next) => {
  // For testing, allow all
  // In production, verify token and set req.user
  req.user = { _id: "testuserid123" }; 
  next();
};

// Test route - no auth required
router.get("/test", (req, res) => {
  res.json({ message: "✅ /api/user/test route is working!" });
});

// Profile route - auth required
router.get('/profile', auth, async (req, res) => {
  try {
    // Dummy user object instead of DB for testing
    const user = { _id: req.user._id, username: "pranit", email: "pranit@example.com" };

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
