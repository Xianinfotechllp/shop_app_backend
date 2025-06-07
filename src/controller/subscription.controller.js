const mongoose = require("mongoose");
const moment = require("moment-timezone");
const User = require("../models/user");
const Subscription = require("../models/subscription");
const { info, error, debug } = require("../middleware/logger"); 

async function handleStartSubscription(req, res) {
  const { plan } = req.body;
  const userId = req.user.id;

  debug(`Subscription start attempt - User: ${userId}, Plan: ${plan}`);

  if (!["30_days", "365_days"].includes(plan)) {
    info(`Invalid plan type requested: ${plan} by user ${userId}`);
    return res
      .status(400)
      .json({ success: false, message: "Invalid plan type" });
  }

  try {
    const duration = plan === "30_days" ? 30 : 365;
    const now = moment().tz("Asia/Kolkata").toDate();

    let existingSubscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (existingSubscription) {
      const newEndDate = moment(existingSubscription.endDate)
        .add(duration, "days")
        .toDate();
      existingSubscription.endDate = newEndDate;
      await existingSubscription.save();
      
      info(`Subscription extended - User: ${userId}, Plan: ${plan}, New end date: ${moment(newEndDate).format()}`);
      return res.status(200).json({
        success: true,
        message: "Subscription extended",
        subscription: existingSubscription,
      });
    }

    const startDate = now;
    const endDate = moment(now).add(duration, "days").toDate();

    const newSubscription = await Subscription.create({
      userId,
      plan,
      startDate,
      endDate,
      status: "active",
      paymentStatus: "paid",
    });

    await User.findByIdAndUpdate(userId, {
      subscriptionId: newSubscription._id,
    });

    info(`New subscription activated - User: ${userId}, Plan: ${plan}, ID: ${newSubscription._id}`);
    return res.status(200).json({
      success: true,
      message: "Subscription activated",
      subscription: newSubscription,
    });
  } catch (err) {
    error(`Failed to start subscription - User: ${userId}, Error: ${err.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
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

        const user = await mongoose.model("user").findById(sub.userId);

        if (user) {
          sub.userDetails = {
            name: user.name,
            email: user.mobileNumber,
          };
        }

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

const handleSubscriptionByUser = async (req, res) => {
  const { userId } = req.params;
  console.log("User ID:", userId);

  try {
    const subscription = await Subscription.find({ userId }).populate({
      path: "userId",
      model: "user", // 👈 explicitly reference the User model
      select: "name mobileNumber state place locality pincode subscriptionId",
    });

    if (!subscription || subscription.length === 0) {
      return res
        .status(404)
        .json({ message: "No subscription found for this user." });
    }

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error("Error fetching subscription by user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};



module.exports = {
  handleStartSubscription,
  handleCheckSubscriptionStatus,
  handleGetAllSubscriptions,
  handleSubscriptionByUser
};


