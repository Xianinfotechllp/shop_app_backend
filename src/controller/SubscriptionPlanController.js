const SubscriptionPlan = require("../models/SubscriptionPlan");
const userModel = require("../models/user"); // For accessing user FCM tokens
const admin = require("../config/admin"); // Firebase Admin SDK (initialized in admin.js)
const Notification = require("../models/notificationModel"); // ✅ Notification model

// @desc   Create a new subscription plan
// @route  POST /api/subscription-plans/createplan
// @access Admin
// When a new subscription plan is created, an FCM notification will be sent to all users with saved tokens

// =================================================================================================
// ============================= 🟢 CREATE SUBSCRIPTION PLAN & NOTIFY USERS ==========================
// =================================================================================================
async function createPlan(req, res) {
  try {
    const { name, durationDays, amount, description } = req.body;

    // ===================================== 💾 SAVE PLAN TO DATABASE ================================
    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      durationDays,
      amount,
      description: (description || "").trim(),
    });

    // ===================================== 📱 GET USERS WITH FCM TOKENS =============================
    const users = await userModel.find({ fcmTokens: { $exists: true, $ne: [] } });

    // ===================================== 📡 EXTRACT ALL TOKENS =====================================
    const allTokens = users.flatMap(user => user.fcmTokens);

    // ===================================== 🔔 SEND FCM NOTIFICATION IF TOKENS FOUND ==================
    if (allTokens.length > 0) {
      const message = {
        notification: {
          title: "New Subscription Plan Available",
          body: `Check out our new plan: ${plan.name} for ₹${plan.amount}\n\nPlan Details: ${plan.description}`,
        },
        tokens: allTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // console.log("✅ FCM Notification Summary:");
      // console.log("Total Sent:", allTokens.length);
      // console.log("Success Count:", response.successCount);
      // console.log("Failure Count:", response.failureCount);

      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.log(`❌ Failed to send to token[${index}]: ${resp.error.message}`);
        }
      });
    } else {
      console.log("ℹ️ No FCM tokens found, notification not sent.");
    }

    // ===================================== 🗂️ SAVE NOTIFICATION TO DATABASE ==========================
    const notificationDoc = new Notification({
      title: "New Subscription Plan Available",
      body: `Check out our new plan: ${plan.name} for ₹${plan.amount}`,
      type: "new_plan",
      recipients: users.map(user => ({
        userId: user._id,
        isRead: false,
      })),
      data: {
        planId: plan._id,
        planName: plan.name,
        amount: plan.amount,
      },
    });

    await notificationDoc.save();

    // ===================================== ✅ SEND SUCCESS RESPONSE ==================================
    return res.status(201).json({ success: true, plan });

  } catch (err) {
    // ===================================== ❌ ERROR HANDLING ========================================
    console.error(" Error in createPlan:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}



// @desc   Get all subscription plans
// @route  GET /api/subscription-plans/getallplan
// @access Public/Admin
async function getAllPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find().sort("durationDays");
    return res.status(200).json({ success: true, plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}


// @desc   Get a specific subscription plan by ID
// @route  GET /api/subscription-plans/getplanbyid/:id
// @access Public/Admin
async function getPlanById(req, res) {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// @desc   Update a subscription plan
// @route  PUT /api/subscription-plans/updateplan/:id
// @access Admin
async function updatePlan(req, res) {
  try {
    const updates = {};
    const { name, durationDays, amount, description } = req.body;
    if (name !== undefined) updates.name = name.trim();
    if (durationDays !== undefined) updates.durationDays = durationDays;
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description.trim();

    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!plan) return res.status(404).json({ success: false, message: "Not found" });

    return res.status(200).json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// @desc   Delete a subscription plan
// @route  DELETE /api/subscription-plans/deleteplan/:id
// @access Admin
async function deletePlan(req, res) {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};



// router.post("/createplan", createPlan);
// router.get("/getallplan", getAllPlans);
// router.get("/getplanbyid/:id", getPlanById);
// router.put("/updateplan/:id", updatePlan);
// router.delete("/deleteplan/:id", deletePlan);