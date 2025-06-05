const express = require("express");
const router = express.Router();
const {
  handleStartSubscription,
  handleCheckSubscriptionStatus,
  handleGetAllSubscriptions,
} = require("../controller/subscription.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/start-subscription", verifyToken, handleStartSubscription);
router.get("/status", verifyToken, handleCheckSubscriptionStatus);
router.get("/getallsubscription", verifyToken, handleGetAllSubscriptions);

module.exports = router;
