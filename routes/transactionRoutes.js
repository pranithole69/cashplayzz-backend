const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  handleDeposit,
  handleWithdraw
} = require('../controllers/transactionController');

// Deposit route
router.post('/deposit', auth, handleDeposit);

// Withdraw route
router.post('/withdraw', auth, handleWithdraw);

module.exports = router;
