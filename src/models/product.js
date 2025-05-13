const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    productImage: {
      type: String,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedTime: {
      type: String,
    },
    productType: {
      type: String,
      // enum: ["kg", "litre", "gram", "piece", "pack", "dozen"],
      required: true,
    },
    deliveryOption: {
      type: String,
      // enum: ["Home Delivery", "Store Pickup"],
      required: true,
    },
    adminId: { type: String, required: false }, // Ensure it's a string
    userId: { type: String, required: false },

    favorite: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: true,
    }

  },
  { timestamps: true }
);

const productModel = mongoose.model("products", productSchema);

module.exports = productModel;




// first we were using this category type but it is giving error 


// category:
//    [
//     {
//       type: String,
//       required: true,
//     },
//    ],

