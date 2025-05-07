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

// Update address by address id
router.put('/update/:userId/:addressId', updateAddressController);

// Delete address by address id
router.delete('/delete/:userId/:addressId', deleteAddressController);

module.exports = router;
