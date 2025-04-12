const adminModel = require('../models/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { info, error, debug } = require('../middleware/logger'); 

const handleAdminRegister = async (req, res) => {
    try {
      const { name, email, mobileNumber } = req.body;
      
      debug(`Admin registration attempt: ${email || mobileNumber}`);
      
      if (!req.body.password) {
        info(`Registration failed: Missing password for ${email || mobileNumber}`);
        return res.status(400).json({ message: "Password is required" });
      }
  
      const existingAdmin = await adminModel.findOne({ 
        $or: [{ email }, { mobileNumber }] 
      });
  
      if (existingAdmin) {
        info(`Registration failed: Admin already exists - ${email || mobileNumber}`);
        return res.status(400).json({ message: "Admin already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
      const adminData = { name, password: hashedPassword };
  
      if (email) adminData.email = email;
      if (mobileNumber) adminData.mobileNumber = mobileNumber;
  
      const newAdmin = await adminModel.create(adminData);
      
      const token = jwt.sign(
        { id: newAdmin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "365d" }
      );
      
      info(`Admin registered successfully: ${email || mobileNumber} (ID: ${newAdmin._id})`);
      return res.status(201).json({ message: "Admin registered", token });
    } catch (error) {
      error(`Admin registration error: ${error.message}`);
      return res.status(500).json({ message: error.message });
    }
};

const handleAdminLogin = async (req, res) => {
    try {
        const { email, mobileNumber } = req.body;
        
        debug(`Admin login attempt: ${email || mobileNumber}`);
        
        if (!req.body.password) {
            info(`Login failed: Missing password for ${email || mobileNumber}`);
            return res.status(400).json({ message: "Password is required" });
        }
        
        const admin = await adminModel.findOne({
            $or: [{ email }, { mobileNumber }],
        });
        
        if (!admin) {
            info(`Login failed: Admin not found - ${email || mobileNumber}`);
            return res.status(400).json({ message: "Admin not found" });
        }
        
        const isMatch = await bcrypt.compare(req.body.password, admin.password);
        
        if (!isMatch) {
            info(`Login failed: Invalid credentials for ${email || mobileNumber}`);
            return res.status(400).json({ message: "Invalid credentials" });
        }
        
        const token = jwt.sign(
            { id: admin._id, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "365d" }
        );
        
        const { password: _, ...adminDetails } = admin.toObject();
        
        info(`Admin login successful: ${email || mobileNumber} (ID: ${admin._id})`);
        return res.status(200).json({
            message: "Login successful",
            token,
            admin: adminDetails
        });
    } catch (err) {
        error(`Admin login error: ${err.message}`);
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    handleAdminRegister,
    handleAdminLogin
};