const express = require('express');
const router = express.Router();
const {
  createAddressController,
  getAddressesController,
  updateAddressController,
  deleteAddressController 
} = require('../controller/deliveryAddresscontroller');



// Add address here
router.post('/create/:userId', createAddressController);

// Get all addresses for a user
router.get('/get/:userId', getAddressesController);

// Update address by index
router.put('/update/:userId/:index', updateAddressController);

// Delete address by index
router.delete('/delete/:userId/:index', deleteAddressController);

module.exports = router;
