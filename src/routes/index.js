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

//shanky
router.use("/api/user", userRoutes);

module.exports = router;
