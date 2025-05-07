const DeliveryAddress = require('./deliveryAddress.model');

// Add a new address (pushed into array)
exports.createAddressController = async (req, res) => {
  try {
    const { userId, address } = req.body;
    const updated = await DeliveryAddress.findOneAndUpdate(
      { userId },
      { $push: { addresses: address } },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Address added', addresses: updated.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all addresses
exports.getAddressesController = async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await DeliveryAddress.findOne({ userId });
    if (!doc) return res.status(404).json({ message: 'No address found for user' });
    res.json({ addresses: doc.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update one address from array using index
exports.updateAddressController = async (req, res) => {
  try {
    const { userId, index } = req.params;
    const { address } = req.body;
    const doc = await DeliveryAddress.findOne({ userId });
    if (!doc || !doc.addresses[index]) return res.status(404).json({ message: 'Address not found' });
    doc.addresses[index] = address;
    await doc.save();
    res.json({ message: 'Address updated', addresses: doc.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete one address using index
exports.deleteAddressController = async (req, res) => {
  try {
    const { userId, index } = req.params;
    const doc = await DeliveryAddress.findOne({ userId });
    if (!doc || !doc.addresses[index]) return res.status(404).json({ message: 'Address not found' });
    doc.addresses.splice(index, 1);
    await doc.save();
    res.json({ message: 'Address deleted', addresses: doc.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
