const express = require('express');
const router = express.Router();
const { handleUserRegistration, handleUserLogin,sendOtpController,verifyOtpController,resetPasswordController,
   saveFcmTokenController} = require("../controller/userAuth.controller");

//- index.js route - 
// /auth/user

router.post("/register",handleUserRegistration);
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