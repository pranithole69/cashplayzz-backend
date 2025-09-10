const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();

// ===== CORS Configuration =====
app.use(cors({
  origin: [
    "https://cashplayzz.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[HIDDEN]';
    console.log('Body:', JSON.stringify(logBody));
  }
  next();
});

// ===== DIRECT ADMIN LOGIN - FIRST ROUTE =====
const User = require('./models/User');

app.post("/api/admin/login", async (req, res) => {
  console.log('🔥 ADMIN LOGIN ROUTE HIT!');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Body:', req.body);
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    console.log('🔍 Looking for user:', username);
    
    // Find admin user
    const user = await User.findOne({ 
      $or: [{ email: username }, { username: username }]
    });

    console.log('👤 User found:', user ? `${user.email} (${user.role})` : 'Not found');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (user.role !== 'admin') {
      console.log('❌ User is not admin, role:', user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    // Check password
    console.log('🔑 Checking password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isValid);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials
