const Notification = require("../models/notificationModel");

// ✅ Get all unread notifications for a specific user
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({
      recipients: {
        $elemMatch: {
          userId,
          isRead: false,
        },
      },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Unread notifications fetched",
      notifications,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getUserNotifications,
};



// ✅ put request - Mark notification as read or unread for a specific user
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, isRead } = req.body;

    const updated = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        "recipients.userId": userId,
      },
      {
        $set: {
          "recipients.$.isRead": isRead,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification or recipient not found" });
    }

    res.status(200).json({
      message: `Notification marked as ${isRead ? "read" : "unread"}`,
    });
  } catch (err) {
    console.error("Error marking notification:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ delete request - Delete a notification only for a specific user
const deleteNotificationForUser = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const updated = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        "recipients.userId": userId,
      },
      {
        $pull: {
          recipients: { userId },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification or recipient not found" });
    }

    res.status(200).json({ message: "Notification deleted for user" });
  } catch (err) {
    console.error("Error deleting notification:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  deleteNotificationForUser,
};