const SubscriptionPlan = require("../models/SubscriptionPlan");
const userModel = require("../models/user"); // For accessing user FCM tokens
const admin = require("firebase-admin"); // Firebase Admin SDK (initialized in admin.js)


// @desc   Create a new subscription plan
// also we will send fcm notification to all user when the new subscription plan is created in this controller 

// @route  POST /api/subscription-plans/createplan
// @access Admin
async function createPlan(req, res) {
  try {
    const { name, durationDays, amount, description } = req.body;

    // Step 1: Create the subscription plan in the database
    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      durationDays,
      amount,
      description: (description || "").trim(),
    });

    // Step 2: Find users who have at least one FCM token saved
    const users = await userModel.find({ fcmTokens: { $exists: true, $ne: [] } });

    // Step 3: Extract all tokens from all users into one array
    const allTokens = users.flatMap(user => user.fcmTokens);

    // Step 4: If tokens are found, send a notification to all
    if (allTokens.length > 0) {
      const message = {
        notification: {
          title: "New Subscription Plan Available",
          body: `Check out our new plan: ${plan.name} for ₹${plan.amount}\n\nPlan Details: ${plan.description}`,
        },
        tokens: allTokens, // List of device tokens to send notification to
      };

      // Step 5: Use Firebase Admin SDK to send the notification
      const response = await admin.messaging().sendMulticast(message);
      console.log("FCM notifications sent successfully to", response.successCount, "users");
    } else {
      console.log("No FCM tokens found. Notification not sent.");
    }

    return res.status(201).json({ success: true, plan });
  } catch (err) {
    console.error("Error in createPlan:", err);
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