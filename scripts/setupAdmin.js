require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create or update admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await User.findOneAndUpdate(
      { email: 'holepranit1@gmail.com' },
      {
        email: 'holepranit1@gmail.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      },
      { upsert: true, new: true }
    );

    console.log('🎉 Admin user ready!');
    console.log('📧 Email: holepranit1@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', admin._id);
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

setupAdmin();
