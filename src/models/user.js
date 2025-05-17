const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  // place: {
  //   type: String,      // we removed the place in location comparing cz we are not getting this from the google map response
  //   required: true,
  // },
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
      type: mongoose.Schema.Types.ObjectId,    //  new fields for saving the users favorite products 
      ref: "products",
    },
  ],
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
