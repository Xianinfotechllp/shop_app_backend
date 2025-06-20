const express = require('express');
const router = express.Router();
const { handleUserRegistration,OtpVerificationUserRegistration ,handleUserLogin,sendOtpController,verifyOtpController,resetPasswordController,
   saveFcmTokenController} = require("../controller/userAuth.controller");

//- index.js route - 
// /auth/user

// registration
router.post("/register",handleUserRegistration);

// verify otp for user "registeration" 
router.post("/verify-registration-otp",OtpVerificationUserRegistration);

// user login
router.post("/login",handleUserLogin);
// Route to send OTP to email
router.post("/send-otp", sendOtpController);
// Route to verify OTP
router.post("/verify-otp", verifyOtpController);
// Route to reset password
router.post("/reset-password", resetPasswordController);
// ✅ New route to save FCM token
router.post("/save-fcm-token",saveFcmTokenController);

module.exports = router;