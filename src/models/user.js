const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
     type: String,
      required: true
     },
  email: {
     type: String,
      required: true,
       unique: true 
      },
  mobileNumber: { 
    type: Number,
     required: true
     },
  password: {
     type: String,
      required: true
     },
  state: { 
    type: String,
     required: true
     },
  place: { 
    type: String
   },
  locality: {
     type: String,
      required: true
     },
  pincode: {
     type: String,
      required: true
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
  favorites: [{
     type: mongoose.Schema.Types.ObjectId,
      ref: "products" 
    }],
  otp: { 
    type: String,
     default: null
     },
  otpExpiry: {
     type: Date,
      default: null
     },
  isVerified: {
     type: Boolean,   // we will mark this as true when user while registering will provide the correct otp and get registered if he dont 
    default: false    // if he dont 
    },
  fcmTokens: [{ 
    type: String
   }],
});

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
