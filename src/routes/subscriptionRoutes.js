const express = require("express");
const router = express.Router();
const {
  handleStartSubscription,
  handleCheckSubscriptionStatus,
  handleGetAllSubscriptions,
  handleSubscriptionByUser
} = require("../controller/subscription.controller");
const { verifyToken } = require("../middleware/verifyToken");

//index.js route - /api/subscription
router.post("/start-subscription", verifyToken, handleStartSubscription);
router.get("/status", verifyToken, handleCheckSubscriptionStatus);
router.get("/getallsubscription", verifyToken, handleGetAllSubscriptions);



module.exports = router;
