const express = require("express");
const router = express.Router();
const { placeOrderController } = require("../controller/order.controller");
const { verifyToken } = require("../middleware/verifyToken");

//place your order on this route
router.post("/place", verifyToken, placeOrderController);

module.exports = router;



// const express = require("express");
// const router = express.Router();
// const {
//   handleCreateOrder,
//   handleGetOrderById,
//   handleGetAllOrders,
//   handleGetUserOrders,
//   handleUpdateOrderStatus,
//   handleUpdatePaymentStatus,
//   handleDeleteOrder,
// } = require("../controller/order.controller");
// const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");

// router.post("/", verifyToken, handleCreateOrder);
// router.get("/orders", handleGetAllOrders);
// router.get("/get-order/:orderId", verifyToken, handleGetOrderById);
// router.get("/user/:userId", verifyToken, handleGetUserOrders);
// router.put("/update-status/:id", handleUpdateOrderStatus);
// router.put("/update-payment/:id", handleUpdatePaymentStatus);
// router.delete("/delete/:id", handleDeleteOrder);

// module.exports = router;
