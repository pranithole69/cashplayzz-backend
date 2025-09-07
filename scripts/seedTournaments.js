// Load environment variables from server/.env
require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const tournamentsData = require('./realTournaments.json');

async function seed() {
  try {
    // Connect to MongoDB using URI from .env
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Clear existing tournaments
    await Tournament.deleteMany({});
    console.log('Deleted existing tournaments');

    // Insert new tournaments from realTournaments.json
    await Tournament.insertMany(tournamentsData);
    console.log('Seeded new tournaments successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

// Run seeding
seed();
