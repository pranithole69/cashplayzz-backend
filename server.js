const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
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

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CashPlayzz Backend Running",
    timestamp: new Date().toISOString()
  });
});

// DIRECT ADMIN LOGIN ROUTE
const User = require('./models/User');

app.post("/api/admin/login", async (req, res) => {
  console.log('Admin Login Route Hit!');
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required'  // ← FIXED: Properly closed string
      });
    }

    const user = await User.findOne({ 
      $or: [{ email: username }, { username: username }]
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials'  // ← FIXED: Properly closed string
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.'  // ← FIXED: Properly closed string
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials'  // ← FIXED: Properly closed string
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', user.email);
    
    return res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      message: 'Admin login successful'  // ← FIXED: Properly closed string
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message  // ← FIXED: Properly closed string
    });
  }
});

// Load other routes
try {
  const userTournamentsRouter = require('./routes/userTournaments');
  
  app.use("/api/user", require("./routes/user"));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api/deposit", require("./routes/deposit"));
  app.use("/api/withdraw", require("./routes/withdraw"));
  app.use("/api/test", require("./routes/test"));
  app.use('/api', userTournamentsRouter);
  
} catch (error) {
  console.error('Error loading routes:', error.message);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'  // ← FIXED: Properly closed string
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`  // ← FIXED: Properly closed string
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
