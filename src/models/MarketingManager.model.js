// ==============================
// models/MarketingManager.model.js
// ==============================

const mongoose = require('mongoose');

const marketingManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankAccountNumber: { type: String, required: true },
  bankName: { type: String, required: true }, // ✅ added bank name

  isApproved: { type: Boolean, default: false },
  assignedSalesmen: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salesman' }]
}, { timestamps: true });

module.exports = mongoose.model('MarketingManager', marketingManagerSchema);
