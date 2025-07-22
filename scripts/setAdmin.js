require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');  // Adjust path if needed

async function setAdminRole() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const emailOrUsername = 'holepranit1@gmail.com';  // Your email here

    const result = await User.findOneAndUpdate(
      { email: emailOrUsername },   // Or { username: emailOrUsername }
      { role: 'admin' },
      { new: true }
    );

    if (result) {
      console.log(`✅ Updated user ${result.email} to admin`);
    } else {
      console.log('User not found!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

setAdminRole();
