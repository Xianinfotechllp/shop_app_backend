const jwt = require("jsonwebtoken");
const { info, error, debug } = require("../middleware/logger"); 

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  
  if (!token) {
    info(`Access attempt without token - IP: ${req.ip}, URL: ${req.originalUrl}`);
    return res.status(403).json({ message: "Token required" });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      error(`Invalid token verification - IP: ${req.ip}, URL: ${req.originalUrl}, Error: ${err.message}`);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    debug(`Token verified successfully - User ID: ${decoded.id}, Role: ${decoded.role}, URL: ${req.originalUrl}`);
    req.user = decoded;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    info(`Non-admin access attempt to restricted resource - User ID: ${req.user.id}, Role: ${req.user.role}, URL: ${req.originalUrl}`);
    return res.status(403).json({ message: "Access denied. Admins only" });
  }
  
  debug(`Admin access granted - User ID: ${req.user.id}, URL: ${req.originalUrl}`);
  next();
};


// --- token middleware for manager and sales man

const verifyManager = (req, res, next) => {
  if (req.user.role !== "manager") {
    info(`Access denied: Not a manager - User ID: ${req.user.id}`);
    return res.status(403).json({ message: "Managers only" });
  }
  next();
};

const verifySalesman = (req, res, next) => {
  if (req.user.role !== "salesman") {
    info(`Access denied: Not a salesman - User ID: ${req.user.id}`);
    return res.status(403).json({ message: "Salesmen only" });
  }
  next();
};




module.exports = {
  verifyToken,
  verifyAdmin,
  verifyManager,
 verifySalesman
};