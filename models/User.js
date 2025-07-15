const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },

    // 👇 Add these new fields for wallet & stats
    balance: { type: Number, default: 0 },
    totalDeposits: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWin: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },
    role: { type: String, default: 'user' } // this helps us identify admins
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
