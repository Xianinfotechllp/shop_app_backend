const mongoose = require('mongoose');

const DeliveryAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  addresses: [
    {
      countryName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      houseNo: { type: String, required: true },
      area: { type: String, required: true },
      landmark: { type: String },
      pincode: { type: String, required: true },
      town: { type: String, required: true },
      state: { type: String, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('DeliveryAddress', DeliveryAddressSchema);
