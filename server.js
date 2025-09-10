const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userTournamentsRouter = require('./routes/userTournaments');

// Load environment variables from .env
dotenv.config();

const app = express();

// ===== Enhanced CORS Middlewares =====
app.use(
  cors({
    origin: [
      "https://cashplayzz.vercel.app", // Your production frontend
      "http://localhost:3000",        // React dev server
      "http://localhost:5173",        // Vite dev server
      "http://localhost:4173"         // Vite preview
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
  
  // Log request body for POST/PUT requests (excluding sensitive data)
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
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// ===== Import Routes =====
console.log("🔧 Loading API routes...");

app.use("/api/user", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/deposit", require("./routes/deposit"));
app.use("/api/withdraw", require("./routes/withdraw"));
app.use("/api/test", require("./routes/test")); // UptimeRobot or warmup route
app.use('/api', userTournamentsRouter);

console.log("✅ All API routes loaded successfully");

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
    // Don't exit in production, let it retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB reconnected');
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
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

  // Default error response
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
      'GET /api/admin/dashboard',
      'GET /api/user/*',
      'POST /api/auth/*'
    ]
  });
});

// ===== Graceful Shutdown =====
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed.');
    process.exit(0);
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

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Export for testing
module.exports = app;
