const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
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
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        weightInGrams: { type: Number },   //-> here we take product weight in grams (optional) so we can change price of a prodcut according to weight also
        priceWithQuantity: { type: Number, required: true }, // --> this is the amount calculating product price with quantity he bought
        shop: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shop",
        },
      }
    ],
    totalCartAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "canceled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    address: {
      type: Object,
      required: true
    }
  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;
