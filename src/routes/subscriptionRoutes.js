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
router.get("/get-all-subscription", verifyToken, handleGetAllSubscriptions);

module.exports = router;
