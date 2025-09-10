const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userTournamentsRouter = require('./routes/userTournaments');

// Load environment variables from .env
dotenv.config();

const app = express();

// ===== Enhanced CORS Middlewares =====
app.use(
  cors({
    origin: [
      "https://cashplayzz.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:4173"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"]
  })
);

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== Debug Logging Middleware =====
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[REDACTED]';
    console.log(`[${timestamp}] Request Body:`, logBody);
  }
  
  next();
});

// ===== Basic Test Route =====
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "💸 CashPlayzz Backend Running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// ===== Health Check Route =====
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ===== DIRECT ADMIN LOGIN ROUTE (MAIN FIX) =====
const User = require('./models/User');

app.post("/api/admin/login", async (req, res) => {
  console.log('🔥 DIRECT LOGIN ROUTE HIT:', req.method, req.url);
  console.log('🔥 Request body:', req.body);
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    // Find admin user
    const user = await User.findOne({ 
      $or: [{ email: username }, { username: username }]
    });

    console.log('👤 User found:', user ? user.email : 'Not found');

    if (!user || user.role !== 'admin') {
      console.log('❌ Not admin user');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isValid);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', user.email);
    
    res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      message: 'Admin login successful'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Test route for admin
app.all("/api/admin/test", (req, res) => {
  res.json({
    success: true,
    method: req.method,
    path: req.path,
    message: "Admin route base is working"
  });
});

// ===== Import Other Routes =====
console.log("🔧 Loading API routes...");

app.use("/api/user", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/deposit", require("./routes/deposit"));
app.use("/api/withdraw", require("./routes/withdraw"));
app.use("/api/test", require("./routes/test"));
app.use('/api', userTournamentsRouter);

console.log("✅ All API routes loaded");

// ===== MongoDB Connection =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

connectDB();

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// ===== 404 Handler =====
app.use('*', (req, res) => {
  const notFoundMessage = `Route ${req.method} ${req.originalUrl} not found`;
  console.log(`❌ 404: ${notFoundMessage}`);
  
  res.status(404).json({
    success: false,
    message: notFoundMessage,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/admin/login',
      'GET /api/admin/test'
    ]
  });
});

// ===== Start the Server =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Admin Login: http://localhost:${PORT}/api/admin/login`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
});

module.exports = app;
