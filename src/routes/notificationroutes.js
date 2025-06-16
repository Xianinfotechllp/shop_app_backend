const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markNotificationRead,
  deleteNotificationForUser,
} = require("../controller/notification.controller");

//index.js - route - /api/notification
router.get("/getwhole-notificaitons-whole-recipient/:userId", getUserNotifications); // GET unread notifications
router.put("/:notificationId/read", markNotificationRead); // PUT mark read/unread
router.delete("/deletenotificaiton/:notificationId", deleteNotificationForUser); // DELETE notification for user

module.exports = router;
