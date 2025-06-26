const express = require("express");
const router = express.Router();
const {handleGetAllUsers,handleGetUserById,handleUpdateUser,deleteUserController,getUserLocation,updateUserLocation,getUserDetailsController,AdminsearchUserController} = require("../controller/user.controller");
const shopController = require("../controller/shop.Controller");
const {handleStartSubscription,handleCheckSubscriptionStatus,handleGetAllSubscriptions,handleSubscriptionByUser} = require("../controller/subscription.controller");
const { verifyToken,verifyAdmin } = require("../middleware/verifyToken");

router.get("/getalluser",handleGetAllUsers);
router.get("/search-users/:keyword",AdminsearchUserController);
router.get("/getallshops",shopController.AdminGetAllShops);
router.get("/search-shop/:keyword", shopController.AdminsearchShopController);
router.put('/change-shop-ban-status/:shopId', shopController.AdminChangeShopBanStatus);
router.delete("/deleteuser/:id",deleteUserController);
router.get("/getallsubscription",verifyToken,verifyAdmin , handleGetAllSubscriptions);
// only need admin "token" to access this route
// need both token middleware in this to make this route work
router.get("/subscription/byuserid/:userId",handleSubscriptionByUser);


module.exports = router;