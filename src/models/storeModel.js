// models/storeModel.js (Shop Model)

const mongoose = require("mongoose");

const shopSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    shopName: { type: String },
    category: [{ type: String }],
    sellerType: { type: String },
    state: { type: String },
    place: { type: String },
    locality: { type: String },
    pinCode: {
      type: String,
      match: /^[0-9]{6}$/,
    },
    email: { type: String },
    landlineNumber: { type: String },
    mobileNumber: { type: String },
    isBanned: {
      type: Boolean,
      default: false,
    },
    headerImage: { type: String },

    // ✅ NEW FIELDS
    agentCode: { type: String }, // optional
    registeredBySalesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salesman",
      default: null,
    },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;
