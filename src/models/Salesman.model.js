// ==============================
// models/Salesman.model.js
// ==============================

const mongoose = require('mongoose');

const salesmanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankAccountNumber: { type: String, required: true },
  bankName: { type: String, required: true }, // ✅ added bank name

  // Link to manager (optional)
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketingManager', default: null },

  // Store multiple agent codes issued to this salesman
  agentCode: [{ type: String, unique: true }],

  // Shops added using this salesman's agent codes
  shopsAddedBySalesman: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],

  // Admin approval required before login
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Salesman', salesmanSchema);
