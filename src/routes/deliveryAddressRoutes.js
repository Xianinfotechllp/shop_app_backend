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


// https://shop-app-backend-gsx6.onrender.com/api/delivery/get/67ed4d16df3f88efc6a24745   -- user id in the end in get api

// https://shop-app-backend-gsx6.onrender.com/api/delivery/create/67ed4d16df3f88efc6a24745   -- user id in the end in post api

// https://shop-app-backend-gsx6.onrender.com/api/delivery/update/67ed4d16df3f88efc6a24745/681b3b33320ea94159e609c2   -- userId/addressId  in put request

// http://localhost:8000/api/delivery/delete/67ed4d16df3f88efc6a24745/681b68d28a89187ca2679593   --- userId/addressId  in delete request