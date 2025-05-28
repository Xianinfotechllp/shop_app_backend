const mongoose = require("mongoose");

const shopSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // or "admins" if it's admin-managed
      required: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    category: [
      {
        type: String, // Store category names directly
        required: true,
      },
    ],
    sellerType: {
      type: String,
      // enum: ["Producer", "Retailer", "Wholesaler"],  // Add more seller types if required
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    place: {
      type: String,    
      required: true,
    },
    locality: {
      type: String,   
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/, // Ensures a valid 6-digit pincode
    },
    headerImage: {
      type: String, // Store the URL of the uploaded image
    },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);

module.exports = Shop;




// edappal
// 679576