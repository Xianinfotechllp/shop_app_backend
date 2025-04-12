const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const { info, error, debug } = require("../middleware/logger");

async function handleUserRegistration(req, res) {
  try {
    const { name, mobileNumber, state, password, place, pincode } = req.body;
    
    debug(`User registration attempt - Name: ${name}, MobileNumber: ${mobileNumber}`);
    
    if (!name || !mobileNumber || !password) {
      info(`Registration failed: Missing required fields - Name: ${name ? 'Provided' : 'Missing'}, MobileNumber: ${mobileNumber ? 'Provided' : 'Missing'}, Password: ${password ? 'Provided' : 'Missing'}`);
      return res
        .status(400)
        .json({ message: "Name, mobileNumber, and password are required" });
    }
    
    const existingUser = await userModel.findOne({ mobileNumber });
    if (existingUser) {
      info(`Registration failed: User already exists - MobileNumber: ${mobileNumber}`);
      return res.status(409).json({ message: "User already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new userModel({
      name,
      mobileNumber, 
      state,
      password: hashedPassword,
      place,
      pincode,
    });
    await newUser.save();
    
    const token = jwt.sign(
      { id: newUser._id, mobileNumber },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    
    info(`User registered successfully - ID: ${newUser._id}, Name: ${name}, MobileNumber: ${mobileNumber}`);
    
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name,
        mobileNumber, 
        state,
        place,
        pincode,
      },
      token,
    });
  } catch (err) {
    error(`Registration error - Error: ${err.message}`);
    console.error("Error in registration:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function handleUserLogin(req, res) {
  try {
    const { name, mobileNumber, password } = req.body;
    
    debug(`User login attempt - Name: ${name || 'Not provided'}, MobileNumber: ${mobileNumber || 'Not provided'}`);
    
    let query = {};
    if (name) {
      query.name = name;
    }
    if (mobileNumber) {
      query.mobileNumber = mobileNumber;
    }
    
    const existingUser = await userModel.findOne(query);
    if (!existingUser) {
      info(`Login failed: User not found - Name: ${name || 'Not provided'}, MobileNumber: ${mobileNumber || 'Not provided'}`);
      return res.status(400).json({ message: "User not found!" });
    }
    
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    
    if (!isPasswordValid) {
      info(`Login failed: Invalid password - UserID: ${existingUser._id}, Name: ${existingUser.name}`);
      return res.status(400).json({ message: "Invalid password!" });
    }
    
    const token = jwt.sign(
      { id: existingUser._id, name: existingUser.name, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    
    info(`Login successful - UserID: ${existingUser._id}, Name: ${existingUser.name}, Role: ${existingUser.role}`);
    
    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        mobileNumber: existingUser.mobileNumber,
        role: existingUser.role
      },
    });
  } catch (err) {
    error(`Login error - Error: ${err.message}`);
    console.error(err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
}

module.exports = { 
    handleUserRegistration, 
    handleUserLogin
};