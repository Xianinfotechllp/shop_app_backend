const express = require('express');
const router = express.Router();
const {
  createAddressController,
  getAddressesController,
  updateAddressController,
  deleteAddressController
} = require('./deliveryAddress.controller');

// Add address
router.post('/', createAddressController);

// Get all addresses for a user
router.get('/:userId', getAddressesController);

// Update address by index
router.put('/:userId/:index', updateAddressController);

// Delete address by index
router.delete('/:userId/:index', deleteAddressController);

module.exports = router;
