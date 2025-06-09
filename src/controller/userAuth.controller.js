const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const { info, error, debug } = require("../middleware/logger");
const nodemailer = require("nodemailer");
require("dotenv").config();



// place and locality added back to location fields
// also added new fields (email)
async function handleUserRegistration(req, res) {
  try {
    const { name, email, mobileNumber, state, password, pincode, place, locality } = req.body;

    console.log(name, email, mobileNumber, state, password, pincode, place, locality);

    debug(`User registration attempt - Name: ${name}, Email: ${email}, MobileNumber: ${mobileNumber}`);

    // Validate required fields
    if (!name || !email || !mobileNumber || !password) {
      info(`Registration failed: Missing fields - Name: ${name ? '✅' : '❌'}, Email: ${email ? '✅' : '❌'}, MobileNumber: ${mobileNumber ? '✅' : '❌'}, Password: ${password ? '✅' : '❌'}`);
      return res.status(400).json({ message: "Name, email, mobileNumber, and password are required" });
    }

    // Check if user already exists by email or mobile
    const existingUser = await userModel.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      info(`Registration failed: User already exists - Email: ${email}, MobileNumber: ${mobileNumber}`);
      return res.status(409).json({ message: "User with this email or mobile number already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new userModel({
      name,
      email,
      mobileNumber,
      state,
      password: hashedPassword,
      pincode,
      place,
      locality,
      otp: null,
      otpExpiry: null
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, mobileNumber, email },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    info(`User registered successfully - ID: ${newUser._id}, Name: ${name}, Email: ${email}, MobileNumber: ${mobileNumber}`);

    // Response
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name,
        email,
        mobileNumber,
        state,
        pincode,
        place,
        locality
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


// -------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------

// forget password and reset with otp system controller starts here 
// (for that we have three controller ) one is sendotp , one is verify otp , one is reset password


// Helper to generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to send email using nodemailer
const sendEmail = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD, // Use App Password if using Gmail
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_ID,
    to: email,
    subject,
    text: message,
  });
};

// 1. Controller to send OTP
const sendOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    await sendEmail(
      email,
      "Your OTP for password reset",
      `Your OTP is ${otp}. It will expire in 5 minutes.`
    );

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Controller to verify OTP
const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.status(200).json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Controller to reset password
const resetPasswordController = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await userModel.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------


module.exports = { 
  handleUserRegistration, 
  handleUserLogin,
  sendOtpController,
  verifyOtpController,
  resetPasswordController, 
};