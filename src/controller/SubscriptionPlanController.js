const SubscriptionPlan = require("../models/SubscriptionPlan");
const userModel = require("../models/user"); // For accessing user FCM tokens
const admin = require("../config/admin"); // Firebase Admin SDK (initialized in admin.js)

// @desc   Create a new subscription plan
// @route  POST /api/subscription-plans/createplan
// @access Admin
// When a new subscription plan is created, an FCM notification will be sent to all users with saved tokens

async function createPlan(req, res) {
  try {
    const { name, durationDays, amount, description } = req.body;

    // Step 1: Save the new subscription plan to the database
    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      durationDays,
      amount,
      description: (description || "").trim(),
    });

    // Step 2: Find users with at least one FCM token saved
    const users = await userModel.find({ fcmTokens: { $exists: true, $ne: [] } });

    // Step 3: Gather all tokens into a single array
    const allTokens = users.flatMap(user => user.fcmTokens);

    // Step 4: If tokens exist, prepare and send notification
    if (allTokens.length > 0) {
      const message = {
        notification: {
          title: "New Subscription Plan Available",
          body: `Check out our new plan: ${plan.name} for ₹${plan.amount}\n\nPlan Details: ${plan.description}`,
        },
        tokens: allTokens,
      };

      // Step 5: Send notification using Firebase Admin SDK
      const response = await admin.messaging().sendEachForMulticast(message);

      console.log("✅ FCM Notification Summary:");
      console.log("Total Sent:", allTokens.length);
      console.log("Success Count:", response.successCount);
      console.log("Failure Count:", response.failureCount);

      // Optional: log failed tokens for debugging
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.log(`❌ Failed to send to token[${index}]: ${resp.error.message}`);
        }
      });
    } else {
      console.log("ℹ️ No FCM tokens found, notification not sent.");
    }

    return res.status(201).json({ success: true, plan });
  } catch (err) {
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