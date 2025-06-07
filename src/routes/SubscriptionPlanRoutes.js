const express = require("express");
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require("../controller/SubscriptionPlanController");

router.post("/createplan", createPlan);
router.get("/getallplan", getAllPlans);
router.get("/getplanbyid/:id", getPlanById);
router.put("/updateplan/:id", updatePlan);
router.delete("/deleteplan/:id", deletePlan);

module.exports = router;
