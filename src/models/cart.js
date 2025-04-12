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
          ref:"products", 
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        totalAmount: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

const cartModel = mongoose.model("carts", cartSchema);

module.exports = cartModel;
