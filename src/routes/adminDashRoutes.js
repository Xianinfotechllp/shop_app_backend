const express = require("express");
const router = express.Router();
const {handleGetAllUsers,handleGetUserById,handleUpdateUser,deleteUserController,getUserLocation,updateUserLocation,getUserDetailsController} = require("../controller/user.controller");
const shopController = require("../controller/shop.Controller");
const {handleStartSubscription,handleCheckSubscriptionStatus,handleGetAllSubscriptions,} = require("../controller/subscription.controller");

router.get("/getalluser",handleGetAllUsers);
router.get("/getallshops",shopController.getShops);
router.delete("/deleteuser/:id",deleteUserController);
router.get("/getallsubscription",  handleGetAllSubscriptions);


module.exports = router;