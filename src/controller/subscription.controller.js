const mongoose = require("mongoose");
const moment = require("moment-timezone");
const User = require("../models/user");
const Subscription = require("../models/subscription");
const Notification = require("../models/notificationModel"); // ✅ Import Notification model
const { info, error, debug } = require("../middleware/logger");
const admin = require("../config/admin");

// =================================================================================================
// ============================== 🟢 HANDLE START OR EXTEND SUBSCRIPTION ============================
// =================================================================================================
// remember if same user buy the same plan again it will add up days and amount in the previous plan he bought first it will not show it as different different seperate subscription of that same user  
async function handleStartSubscription(req, res) {
  const durationDays = Number(req.body.durationDays);
  const amount = Number(req.body.amount);
  const userId = req.user.id;
  const subscriptionPlanId = req.body.subscriptionPlanId;

  if (isNaN(durationDays) || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: "durationDays and amount must be valid numbers",
    });
  }

  const now = moment().tz("Asia/Kolkata").toDate();

  try {
    // ===================================== 🔄 CHECK FOR ACTIVE SUBSCRIPTION =========================
    let existingSubscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    let responseMessage = "";
    let subscription;

    if (existingSubscription) {
      // ===================================== ⏫ EXTEND SUBSCRIPTION ================================
      const newEndDate = moment(existingSubscription.endDate)
        .add(durationDays, "days")
        .toDate();
      existingSubscription.endDate = newEndDate;
      existingSubscription.amount += amount;
      existingSubscription.durationDays += durationDays; // ✅ update durationDays
      await existingSubscription.save();

      responseMessage = "Subscription extended";
      subscription = existingSubscription;
    } else {
      // ===================================== 🆕 CREATE NEW SUBSCRIPTION =============================
      const startDate = now;
      const endDate = moment(now).add(durationDays, "days").toDate();

      const newSubscription = await Subscription.create({
        userId,
        subscriptionPlanId,   // added subscription plan id now we can access the subscription plan details too 
        durationDays,
        amount,
        startDate,
        endDate,
        status: "active",
        paymentStatus: "paid",
      });

      await User.findByIdAndUpdate(userId, {
        subscriptionId: newSubscription._id,
      });

      responseMessage = "Subscription activated";
      subscription = newSubscription;
    }

    // ===================================== 🔔 SEND FCM TO THAT USER ONLY =============================
    const user = await User.findById(userId);
    const tokens = user?.fcmTokens || [];

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "✅ Subscription Active!",
          body: `Your subscription is now active for ${durationDays} days.`,
        },
        tokens,
      };

      const fcmResponse = await admin.messaging().sendEachForMulticast(message);
      // console.log("✅ FCM Notification Summary:");
      // console.log("Total Sent:", tokens.length);
      // console.log("Success Count:", fcmResponse.successCount);
      // console.log("Failure Count:", fcmResponse.failureCount);
    } else {
      console.log("No FCM tokens found for this user. Notification not sent.");
    }

    // ===================================== 🗂️ SAVE NOTIFICATION TO DB FOR THIS USER ONLY =============
    const notificationDoc = new Notification({
      title: "✅ Subscription Active!",
      body: `Your subscription is now active for ${durationDays} days.`,
      type: "subscription_activated",
      recipients: [{
        userId: user._id,     // will only saves the user id of user who buys the subscription in each start-subscription document in db
        isRead: false,        // unlike other controller - "create shop controller" where we will save all the user id and it own isread field in one notification document and will get update
      }],
      data: {
        subscriptionId: subscription._id,
        durationDays,
        amount,
      },
    });

    await notificationDoc.save();

    // ===================================== ✅ SEND SUCCESS RESPONSE ================================
    return res.status(200).json({
      success: true,
      message: responseMessage,
      subscription,
    });

  } catch (err) {
    // ===================================== ❌ ERROR HANDLING ========================================
    console.error("Failed to start subscription:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}


async function handleCheckSubscriptionStatus(req, res) {
  const userId = req.user.id;
  
  debug(`Checking subscription status - User: ${userId}`);

  try {
    const user = await User.findById(userId).populate("subscriptionId");
    if (!user || !user.subscriptionId) {
      info(`No active subscription found - User: ${userId}`);
      return res
        .status(200)
        .json({
          success: true,
          message: "No active subscription",
          subscription: null,
        });
    }

    const subscription = user.subscriptionId;
    const currentDate = moment().tz("Asia/Kolkata");

    if (currentDate.isAfter(subscription.endDate)) {
      subscription.status = "expired";
      await subscription.save();
      info(`Subscription expired - User: ${userId}, Subscription ID: ${subscription._id}`);
      return res
        .status(200)
        .json({ success: true, message: "Subscription expired", subscription });
    }

    subscription.startDate = moment(subscription.startDate)
      .tz("Asia/Kolkata")
      .format();
    subscription.endDate = moment(subscription.endDate)
      .tz("Asia/Kolkata")
      .format();

    debug(`Active subscription found - User: ${userId}, Status: ${subscription.status}, Plan: ${subscription.plan}`);
    return res.status(200).json({ success: true, subscription });
  } catch (err) {
    error(`Failed to check subscription status - User: ${userId}, Error: ${err.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

// in this we send the all subscription with the subscription - plan details also (rn we are using this controller in the admin pannel to see subscription details )
async function handleGetAllSubscriptions(req, res) {
  const adminId = req.user.id;

  debug(`Admin requesting all subscriptions - Admin: ${adminId}`);

  if (req.user.role !== "admin") {
    info(`Unauthorized access attempt to subscriptions list - User: ${adminId}, Role: ${req.user.role}`);
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin privileges required",
    });
  }

  try {
    const subscriptions = await Subscription.find();

    info(`Admin retrieved all subscriptions - Admin: ${adminId}, Count: ${subscriptions.length}`);

    const formattedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription) => {
        const sub = subscription.toObject();

        // ⬇️ Get user details
        const user = await mongoose.model("user").findById(sub.userId);
        if (user) {
          sub.userDetails = {
            name: user.name,
            email: user.mobileNumber,
          };
        }

        // ⬇️ Get subscription plan details
        if (sub.subscriptionPlanId) {
          const plan = await mongoose.model("SubscriptionPlan").findById(sub.subscriptionPlanId);
          if (plan) {
            sub.subscriptionPlanDetails = {
              name: plan.name,
              durationDays: plan.durationDays,
              amount: plan.amount,
              description: plan.description,
            };
          }
        } else {
          sub.subscriptionPlanDetails = "N/A";
        }

        // Format dates
        sub.startDate = moment(sub.startDate).tz("Asia/Kolkata").format();
        sub.endDate = moment(sub.endDate).tz("Asia/Kolkata").format();

        return sub;
      })
    );

    return res.status(200).json({
      success: true,
      subscriptions: formattedSubscriptions,
    });
  } catch (err) {
    error(`Failed to get all subscriptions - Admin: ${adminId}, Error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// with specific user that subscription he bought we send subscription detials and subscription plan details also 
const handleSubscriptionByUser = async (req, res) => {
  const { userId } = req.params;
  console.log("User ID:", userId);

  try {
    const subscriptions = await Subscription.find({ userId })
      .populate({
        path: "userId",
        model: "user",
        select: "name mobileNumber state place locality pincode subscriptionId",
      });

    if (!subscriptions || subscriptions.length === 0) {
      return res
        .status(404)
        .json({ message: "No subscription found for this user." });
    }

    const formatted = await Promise.all(
      subscriptions.map(async (sub) => {
        const obj = sub.toObject();

        // ⬇️ Add subscription plan details if available
        if (obj.subscriptionPlanId) {
          const plan = await mongoose.model("SubscriptionPlan").findById(obj.subscriptionPlanId);
          if (plan) {
            obj.subscriptionPlanDetails = {
              name: plan.name,
              durationDays: plan.durationDays,
              amount: plan.amount,
              description: plan.description,
            };
          } else {
            obj.subscriptionPlanDetails = "N/A";
          }
        } else {
          obj.subscriptionPlanDetails = "N/A";
        }

        return obj;
      })
    );

    res.status(200).json({ success: true, subscription: formatted });
  } catch (error) {
    console.error("Error fetching subscription by user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




module.exports = {
  handleStartSubscription,
  handleCheckSubscriptionStatus,
  handleGetAllSubscriptions,
  handleSubscriptionByUser
};


// route for postman test start subscription

// api/subscription/start-subscription

// postman testing payload for start subscription 

// {
//   "durationDays": 30,
//   "amount": 299,
//   "subscriptionPlanId": "6659ec2fcde435f7d27c4a01"
// }

