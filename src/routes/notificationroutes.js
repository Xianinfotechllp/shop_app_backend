const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  getSpecificRecipientandallNotifications,
  markNotificationRead,
  deleteNotificationForUser,
  deleteNotification
} = require("../controller/notification.controller");

//index.js - route - /api/notification
router.get("/getwhole-notificaitons-whole-recipient/:userId", getUserNotifications); // GET unread notifications
router.get("/get-specific-recipient-whole-notification/:userId",getSpecificRecipientandallNotifications); //Get unread notifications but the recipient will be specific to only that user_id provided in req.params
router.put("/:notificationId/read", markNotificationRead); // PUT mark read/unread
router.delete("/delete-notificaiton-for-user/:notificationId", deleteNotificationForUser); // DELETE notification for user
router.delete("/delete-notification-for-all/:notificationId",deleteNotification) // delete notification for all - like that specific notification will be deleted from the database for all user not for any specific user

module.exports = router;
