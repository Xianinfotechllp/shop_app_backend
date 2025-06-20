const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const { info, error, debug } = require("../middleware/logger");
const nodemailer = require("nodemailer");
require("dotenv").config();


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


//--------------------  User registration logic with the otp verification   -------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------

// place and locality added back to location fields
// also added new fields (email)

const handleUserRegistration = async (req, res) => {
  try {
    const { name, email, mobileNumber, state, password, pincode, place, locality } = req.body;

    if (!name || !email || !mobileNumber || !password || !state || !pincode || !locality) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Check if any user exists with this email or mobile
    const existingUser = await userModel.findOne({
      $or: [{ email: email }, { mobileNumber: mobileNumber }],
    });

    // Case 1: User exists and is already verified
    if (existingUser && existingUser.isVerified === true) {
      return res.status(409).json({ message: "User with this email or mobile number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Case 2: User exists but is not verified - update the record
    //with this let say somehow user registered once but did not try filling otp and that means the user was not deleted or fully verified (isVerified = true) in the database 
    // and if he try registring again in some mean time he will see that his account exist but dont have access 
    // so for that we will identify that user (isVerified = false) and send otp to that email again without .save() that same creadentials again or returning that user already exist
    if (existingUser && existingUser.isVerified === false) {
      existingUser.name = name;
      existingUser.email = email;
      existingUser.mobileNumber = mobileNumber;
      existingUser.password = hashedPassword;
      existingUser.state = state;
      existingUser.pincode = pincode;
      existingUser.place = place;
      existingUser.locality = locality;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
    } else {
      // Case 3: New user
      const newUser = new userModel({
        name,
        email,
        mobileNumber,
        password: hashedPassword,
        state,
        pincode,
        place,
        locality,
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false,
      });
      await newUser.save();
    }

    await sendEmail(email, "OTP for Registration", `Your OTP is ${otp}. It will expire in 5 minutes.`);

    return res.status(200).json({ message: "OTP sent to your email for verification" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// will verify the otp here of the user registration and if user put the correct otp 
// so we make the user (isVerified = true) and return - token,user object
// and if provide the otp after expiry so it will delete the user record that you gave before generating otp
// and will ask you to register again and generate otp again and fill again here 
// but if user put the email (isverified = true) already so it will just say user already exists 
const OtpVerificationUserRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Condition 1: Already Verified
    // checking this condition so we dont delete any already verified user by mistake when somehow
    // accidently if someone provide the wrong email of someone who is already have an account on the app
    // so by this condition we will only delete the user record who failed to provide otp before expiry time
    // and that user (email) is not isVerified  
    if (user.isVerified === true) {
      return res.status(400).json({ message: "User already verified" });
    }

    // ✅ Condition 2: Wrong OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Condition 3: Expired OTP
    if (Date.now() > user.otpExpiry) {

      // ⛔ deleting  the user record from the database if he failed to provide otp in the given time and will ask him to register again so he can generate and request otp on his email again 
      await userModel.deleteOne({ _id: user._id }); // ⛔ Safe to delete as not verified

      return res.status(400).json({ message: "OTP expired. Please register again." });
    }

    // ✅ Condition 4: Correct OTP and Still Valid
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, mobileNumber: user.mobileNumber },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    return res.status(200).json({
      message: "User verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        state: user.state,
        pincode: user.pincode,
        place: user.place,
        locality: user.locality,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};




//----        user registration logic with otp verification ends here   ---------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
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

// - here in this controller we are saving a firebase fcm messaging token 
// in user model so we can send notification to that specific user device

// route - /auth/user/save-fcm-token
const saveFcmTokenController = async (req, res) => {
  const { fcmToken, userId } = req.body; 
  

  if (!fcmToken) {
    return res.status(400).json({ message: "FCM token is required" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Avoid duplicate token entries
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.status(200).json({ message: "FCM token saved successfully" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  handleUserRegistration,
  OtpVerificationUserRegistration, 
  handleUserLogin,
  sendOtpController,
  verifyOtpController,
  resetPasswordController, 
  saveFcmTokenController
};