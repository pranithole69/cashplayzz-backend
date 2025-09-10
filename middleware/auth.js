// middleware/auth.js - REPLACE ENTIRE FILE

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded = { id, role, iat, ... }
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    res.status(401).json({ message: "Invalid token." });
  }
};

const isAdmin = (req, res, next) => {
  console.log("ROLE COMING FROM TOKEN:", req.user.role);

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  next();
};

// Combined admin auth middleware
const adminAuth = [verifyToken, isAdmin];

module.exports = { verifyToken, isAdmin, adminAuth };
