//index.js


const express = require("express");
const router = express.Router();
const userAuthRoutes = require("./userAuthRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const userRoutes = require("./userRoutes");
const orderRoutes = require("./orderRoutes");
const adminAuthRoutes = require("./adminAuthRoutes");
const subscriptionRoutes = require("./subscriptionRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const shopRoutes = require("./shopRoutes");
const categoryRoutes = require("./categoryRoutes");
const deliveryAddressRoutes = require("./deliveryAddressRoutes")
const favoriteRoutes = require("./favoriteRoutes");
const adminDashRoutes = require("./adminDashRoutes");
const managerRoutes = require("./managerRoutes.js");
const salesmanRoutes = require("./salesmanRoutes.js");
const subscriptionPlanRoutes = require("./subscriptionPlanRoutes");
const notificaitonRoutes = require("./notificationroutes")

router.use("/auth/user", userAuthRoutes);
router.use("/auth/admin", adminAuthRoutes);
router.use("/api/category", categoryRoutes);
router.use("/api/products", productRoutes);
router.use("/api/shops", shopRoutes);
router.use("/api/cart", cartRoutes);
router.use("/api/order", orderRoutes);
router.use("/api/subscription", subscriptionRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/delivery", deliveryAddressRoutes);
router.use("/api/favorite",favoriteRoutes);
router.use("/api/subscription-plans",subscriptionPlanRoutes);
router.use("/api/notification",notificaitonRoutes)
//for admin dashboard 
router.use("/adminDashboard",adminDashRoutes);
router.use('/api/manager', managerRoutes);
router.use('/api/salesman', salesmanRoutes);
//shanky
router.use("/api/user", userRoutes);

module.exports = router;
