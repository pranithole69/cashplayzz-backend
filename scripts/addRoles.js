const mongoose = require('mongoose');
const User = require('../models/User'); // make sure this path is correct
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Update users with no role
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    console.log(`✅ ${result.modifiedCount} users updated with role 'user'`);

    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
  });
