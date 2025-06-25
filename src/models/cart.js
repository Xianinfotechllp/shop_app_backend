const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        productPrice: {
          // Individual price of product (without quantity)
          type: Number,
          required: true,
          min: 1,
        },
        totalProductPrice: {
          // price * quantity
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalCartPrice: {
      // Sum of all totalProductPrice
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const cartModel = mongoose.model("carts", cartSchema);

module.exports = cartModel;
