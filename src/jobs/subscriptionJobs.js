const cron = require("node-cron");
const moment = require("moment-timezone");
const Subscription = require("../models/subscription");

console.log("✅ Subscription expiry job initialized.");


cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running subscription expiry check...");

  try {
    const now = moment().tz("Asia/Kolkata").toDate();

    
    const expiredSubscriptions = await Subscription.find({
      endDate: { $lte: now },
      status: "active",
    });

    if (expiredSubscriptions.length > 0) {
      console.log(`⚠️ Expiring ${expiredSubscriptions.length} subscriptions`);

      
      await Subscription.updateMany(
        { _id: { $in: expiredSubscriptions.map((sub) => sub._id) } },
        { $set: { status: "expired" } }
      );

      console.log("✅ Expired subscriptions updated successfully");
    } else {
      console.log("✅ No subscriptions to expire");
    }
  } catch (error) {
    console.error("❌ Error in subscription expiry job:", error);
  }
}, {
  timezone: "Asia/Kolkata",
});
