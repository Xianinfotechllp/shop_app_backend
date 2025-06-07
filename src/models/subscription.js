const mongoose = require("mongoose");
const moment = require("moment-timezone");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  durationDays: {
    type: Number,
    required: true,
  }, // e.g., 23, 45

  amount: {
    type: Number,
    required: true,
  },

  startDate: {
    type: Date,
    required: true,
    default: () => moment().tz("Asia/Kolkata").toDate(),
  },

  endDate: { type: Date, required: true },

  status: {
    type: String,
    enum: ["active", "expired", "pending"],
    default: "pending",
  },

  paymentStatus: {
    type: String,
    enum: ["paid", "failed", "pending"],
    default: "pending",
  },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
