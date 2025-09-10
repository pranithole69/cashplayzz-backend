require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('👤 Admin already exists:', existingAdmin.email);
      
      // Update to admin if user exists but isn't admin
      const updated = await User.findOneAndUpdate(
        { email: 'holepranit1@gmail.com' },
        { role: 'admin' },
        { new: true }
      );
      
      if (updated) {
        console.log('🔄 Updated user to admin:', updated.email);
      }
      
      process.exit(0);
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
      email: 'holepranit1@gmail.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: holepranit1@gmail.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

createAdminUser();
