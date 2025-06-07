const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  durationDays: {
    type: Number,
    required: true,
    min: [1, "durationDays must be at least 1 day"],
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "amount must be non‐negative"],
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
});

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
module.exports = SubscriptionPlan;
