// scripts/fixBalances.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User'); // Adjust path if needed

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addBalanceToAllUsers() {
  try {
    const result = await User.updateMany(
      { balance: { $exists: false } },
      { $set: { balance: 0 } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
  } catch (err) {
    console.error('❌ Error updating balances:', err);
  } finally {
    mongoose.disconnect();
  }
}

addBalanceToAllUsers();
