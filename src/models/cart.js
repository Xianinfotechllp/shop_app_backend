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
          type: Number,
          required: true,
          min: 1,
        },
        totalProductPrice: {
          type: Number,
          required: true,
          min: 1,
        },
        isInCart: {
          // ✅ Set default to false; will be turned true only when added to cart
          type: Boolean,
          default: false,
        },
      },
    ],
    totalCartPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const cartModel = mongoose.model("carts", cartSchema);

module.exports = cartModel;
