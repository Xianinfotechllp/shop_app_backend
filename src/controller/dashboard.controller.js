const Order = require("../models/order");
const User = require("../models/user");
const Subscription = require("../models/subscription");
const Product = require("../models/product");
const {
  getDateRanges,
  calcPercentChange,
  formatOrderId,
} = require("../utils/metrics-utils.js");

async function handleGetMetrics(req, res) {
  try {
    
    const { startOfMonth, startOfLastMonth } = getDateRanges();

    
    const [
      thisMonthRevenueResult,
      lastMonthRevenueResult,
      thisMonthCustomers,
      lastMonthCustomers,
      thisMonthOrders,
      lastMonthOrders,
      activeSubs,
      lastMonthSubs,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      }),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({
        status: "active",
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("userId", "name")
        .lean(),
      Product.find().sort({ sold: -1 }).limit(4).lean(),
    ]);

    
    const totalRevenue = thisMonthRevenueResult[0]?.total || 0;
    const lastMonthRev = lastMonthRevenueResult[0]?.total || 0;

    
    const formattedOrders = recentOrders.map((order) => ({
      orderId: formatOrderId(order._id),
      customer: order.userId?.name || "Unknown",
      amount: order.totalAmount,
      date: new Date(order.createdAt).toISOString().split("T")[0],
    }));

    
    const formattedProducts = topProducts.map((product) => ({
      name: product.name,
      sales: product.sold,
      revenue: product.sold * product.price,
    }));

    
    res.json({
      totalRevenue: {
        amount: totalRevenue,
        change: calcPercentChange(totalRevenue, lastMonthRev).toFixed(1),
      },
      newCustomers: {
        count: thisMonthCustomers,
        change: calcPercentChange(
          thisMonthCustomers,
          lastMonthCustomers
        ).toFixed(1),
      },
      totalOrders: {
        count: thisMonthOrders,
        change: calcPercentChange(thisMonthOrders, lastMonthOrders).toFixed(1),
      },
      activeSubscriptions: {
        count: activeSubs,
        change: calcPercentChange(activeSubs, lastMonthSubs).toFixed(1),
      },
      recentOrders: formattedOrders,
      topProducts: formattedProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  handleGetMetrics,
};
