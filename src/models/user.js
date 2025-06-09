const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {                      // ✅ New field
    type: String,
    required: true,
    unique: true,
  },
  mobileNumber: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  place: {
    type: String,
  },
  locality: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
    enum: ["admin", "user"],
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    default: null,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId, // User's favorite products
      ref: "products",
    },
  ],
  otp: {                      // ✅ New field
    type: String,
    default: null,
  },
  otpExpiry: {                // ✅ New field
    type: Date,
    default: null,
  },
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
