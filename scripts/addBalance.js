const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const addBalance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const identifier = 'holepranit1@gmail.com'; // 🔁 Can be username or email
    const amountToAdd = 1000; // 💰 Amount you want to add

    // ✅ Find user by username OR email
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    user.balance += amountToAdd;
    await user.save();

    console.log(`✅ Balance updated. ${user.username} now has ₹${user.balance}`);
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

addBalance();
