const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // Title of the notification shown to user
    },
    body: {
      type: String,
      required: true, // Main message content of the notification
    },
    recipients: [
      {
        userId: {
          type: mongoose.ObjectId,
          ref: "User", // Reference to user receiving this notification
          required: true,
        },
        isRead: {
          type: Boolean,
          default: false, // To track if this user has read it or not
        },
      },
    ],
    type: {
      type: String,
      required: true, // Type of notification e.g. "new_shop", "order", etc.
    },
    data: {
      type: Object,
      default: {}, // Additional payload like {shopId, orderId, etc.}
    },
    sentAt: {
      type: Date,
      default: Date.now, // When the notification was sent
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);



/* we are inserting notificaiton.save() and saving notification with user id in every controller whoes notification we need

like - create shop , create product ,  create subscription etc 

remember this is differnt from fcm messaging service cz fcm shows notification for once only and 

and we need to send it multiple time until it mark it as "read-true"

and we have get , put,delete request for notification  get notification fetches all the notification with the user  id

who has "read-false" 

****** but get request of notification sends all the notification at once like

- shop,prduct,subscription

so for this frontend developer has to put the condition in the frontend 

of the field "type" which is a field in our notification model so it will set the 

type = shop , type = product etc and frontend can fetch notification to show on which page 

whenever he wants*/