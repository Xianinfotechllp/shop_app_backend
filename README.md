# shop-app-be
# shop-app-be
# shop-app-be


FLOW FOR REGISTRATION WITH OTP VERIFICATION:
User hits /register

→ Validates required fields

→ Checks if a user exists (with email or mobile) and is isVerified === true → reject

→ If exists and isVerified === false, delete the old unverified user

→ Save new user with otp, otpExpiry, isVerified: false

→ Send OTP via email

→ Respond: “OTP sent”

User hits /verify-otp-registration with OTP

→ Find user by email or mobileNumber

→ If not found → error

→ If already isVerified === true → error: already verified

→ If OTP doesn't match → error

→ If Date.now() > otpExpiry →

 """"delete user""""", 
 
 respond: OTP expired,
 
  register again

→ ✅ OTP is correct & within time:

Set isVerified: true

Set otp and otpExpiry to null

Generate JWT

Respond with success + token