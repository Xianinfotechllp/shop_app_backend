const Notification = require("../models/notificationModel");

// ✅ Get all unread notifications and all recipient name for a specific user
// sends only read = false notification , read = true notifications will not be sent
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


// in this instead of sending all the recipient data we will send only that specific userid recipient of params 
// so by this the response will become less heave and easy to transfer and read
// we will use this one instead of using the previous one which is sending the whole recipient name with the all notificaiotion
// in this it will send all notifications but in the response recipient we will only have that specific user_id from params
// sends only read = false notification , read = true notifications will not be sent 
const getSpecificRecipientandallNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch notifications where this user has unread entry
    const notifications = await Notification.find({
      recipients: {
        $elemMatch: { userId, isRead: false }
      }
    }).select("-recipients") // Exclude full recipients array
      .lean();

    // Attach only the matching recipient data
    const userNotifications = notifications.map((notif) => {
      const recipientData = notif.recipients.find(r => r.userId.toString() === userId);
      return {
        _id: notif._id,
        title: notif.title,
        body: notif.body,
        type: notif.type,
        data: notif.data,
        createdAt: notif.createdAt,
        isRead: recipientData?.isRead || false
      };
    });

    res.status(200).json(userNotifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
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

// delete request - Delete a notification only for a specific user
//The deleteNotificationForUser controller removes a specific user 
// from the recipients array of a specific notification document.
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


const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const deleted = await Notification.findByIdAndDelete(notificationId);

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete notification",
      error: err.message,
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  deleteNotificationForUser,
  getSpecificRecipientandallNotifications,
  deleteNotification
};