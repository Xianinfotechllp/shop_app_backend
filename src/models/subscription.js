const mongoose = require("mongoose");
const moment = require("moment-timezone");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["30_days", "365_days"], required: true },
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

const subscriptionModel = mongoose.model("Subscription",subscriptionSchema);

module.exports = subscriptionModel;

