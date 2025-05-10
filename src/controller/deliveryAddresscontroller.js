const DeliveryAddress = require('../models/deliveryAddressmodel.js');

// Add a new address (pushed into array)
exports.createAddressController = async (req, res) => {
  try {
    const {userId} = req.params;
    const { address } = req.body;
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
    const { userId, addressId } = req.params;
    const { address } = req.body;

    const doc = await DeliveryAddress.findOne({ userId });
    if (!doc) return res.status(404).json({ message: 'User not found' });

    const addr = doc.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });

    Object.assign(addr, address); // merge new values into existing
    await doc.save();

    res.json({ message: 'Address updated', addresses: doc.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete one address using index
exports.deleteAddressController = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const doc = await DeliveryAddress.findOne({ userId });
    if (!doc) return res.status(404).json({ message: 'User not found' });

    // Keep only those addresses whose _id does *not* match addressId
    doc.addresses = doc.addresses.filter(
      addr => addr._id.toString() !== addressId
    );

    await doc.save();
    res.json({ message: 'Address deleted', addresses: doc.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



///iiehfinvernvnr

