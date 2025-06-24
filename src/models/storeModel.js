const mongoose = require("mongoose");

const shopSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      // required: true,
    },
    shopName: {
      type: String,
      // required: true,
    },
    category: [
      {
        type: String,
        // required: true,
      },
    ],
    sellerType: {
      type: String,
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    place: {
      type: String,
      // required: true,
    },
    locality: {
      type: String,
      // required: true,
    },
    pinCode: {
      type: String,
      // required: true,
      match: /^[0-9]{6}$/,
    },
    email: {
      type: String,
    },
    landlineNumber: {
      type: String,
    },
    mobileNumber: {
      type: String,
    },
    headerImage: {
      type: String,
    },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);

module.exports = Shop;