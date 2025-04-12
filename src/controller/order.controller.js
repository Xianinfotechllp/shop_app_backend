const orderService = require("../service/order.service");
const { info, error, debug } = require("../middleware/logger");

const handleCreateOrder = async (req, res) => {
  try {
    const orderData = req.body;
    orderData.userId = req.user.id;

    debug(`Order creation attempt - User: ${orderData.userId}`);

    const order = await orderService.createOrder(orderData);
    info(`Order created successfully - User: ${orderData.userId}, OrderID: ${order._id}`);
    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    error(`Failed to create order - User: ${req.user.id}, Error: ${err.message}`);
    console.error("Error in handleCreateOrder:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleGetAllOrders = async (req, res) => {
  try {
    debug(`Fetching all orders - Query params: ${JSON.stringify(req.query)}`);
    const queryParams = req.query;
    const { orders, pagination } = await orderService.getAllOrders(queryParams);
    info(`All orders fetched successfully - Count: ${orders.length}`);
    return res.status(200).json({
      message: "Orders fetched successfully",
      orders,
      pagination,
    });
  } catch (err) {
    error(`Failed to fetch all orders - Error: ${err.message}`);
    console.error("Error in handleGetAllOrders:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleGetOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    debug(`Fetching order by ID - OrderID: ${orderId}, User: ${userId}`);

    const order = await orderService.getOrderById(orderId);

    if (req.user.role !== "admin" && order.userId._id.toString() !== userId.toString()) {
      info(`Unauthorized access attempt to order - OrderID: ${orderId}, User: ${userId}, Role: ${req.user.role}`);
      return res.status(403).json({
        message: "You do not have permission to view this order",
      });
    }

    info(`Order fetched successfully - OrderID: ${orderId}, User: ${userId}`);
    return res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (err) {
    error(`Failed to fetch order by ID - OrderID: ${req.params.orderId}, User: ${req.user.id}, Error: ${err.message}`);
    console.error("Error in handleGetOrderById:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleGetUserOrders = async (req, res) => {
  try {
    const authUserId = req.user.id.toString(); 
    const authUserRole = req.user.role; 
    const requestedUserId = req.params.userId || authUserId;
    
    debug(`Fetching user orders - RequestedUserID: ${requestedUserId}, AuthUserID: ${authUserId}, Role: ${authUserRole}`);

    if (authUserId !== requestedUserId && authUserRole !== "admin") {
      info(`Unauthorized access attempt to user orders - RequestedUserID: ${requestedUserId}, AuthUserID: ${authUserId}, Role: ${authUserRole}`);
      return res.status(403).json({
        message: "You do not have permission to view these orders",
      });
    }

    const queryParams = req.query;
    const { orders, pagination } = await orderService.getOrdersByUser(
      requestedUserId,
      queryParams
    );

    info(`User orders fetched successfully - UserID: ${requestedUserId}, Count: ${orders.length}`);
    return res.status(200).json({
      message: "User orders fetched successfully",
      orders,
      pagination,
    });
  } catch (err) {
    error(`Failed to fetch user orders - RequestedUserID: ${req.params.userId || req.user.id}, Error: ${err.message}`);
    console.error("Error in handleGetUserOrders:", err.stack);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleUpdateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    debug(`Updating order status - OrderID: ${orderId}, Status: ${status}, User: ${req.user.id}, Role: ${req.user.role}`);

    // if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    //   return res.status(403).json({
    //     message: "You do not have permission to update order status"
    //   });
    // }

    const updatedOrder = await orderService.updateOrderStatus(orderId, status);

    info(`Order status updated successfully - OrderID: ${orderId}, Status: ${status}, User: ${req.user.id}`);
    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    error(`Failed to update order status - OrderID: ${req.params.id}, User: ${req.user.id}, Error: ${err.message}`);
    console.error("Error in handleUpdateOrderStatus:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleUpdatePaymentStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { paymentStatus } = req.body;
    
    debug(`Updating payment status - OrderID: ${orderId}, PaymentStatus: ${paymentStatus}, User: ${req.user.id}, Role: ${req.user.role}`);

    // Only admin or authorized staff can update payment status
    // if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    //   return res.status(403).json({
    //     message: "You do not have permission to update payment status"
    //   });
    // }

    const updatedOrder = await orderService.updatePaymentStatus(
      orderId,
      paymentStatus
    );

    info(`Payment status updated successfully - OrderID: ${orderId}, PaymentStatus: ${paymentStatus}, User: ${req.user.id}`);
    return res.status(200).json({
      message: "Payment status updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    error(`Failed to update payment status - OrderID: ${req.params.id}, User: ${req.user.id}, Error: ${err.message}`);
    console.error("Error in handleUpdatePaymentStatus:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleDeleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    debug(`Order deletion attempt - OrderID: ${orderId}, User: ${req.user.id}, Role: ${req.user.role}`);
    
    if (req.user.role !== "admin") {
      info(`Unauthorized delete attempt - OrderID: ${orderId}, User: ${req.user.id}, Role: ${req.user.role}`);
      return res.status(403).json({
        message: "You do not have permission to delete orders",
      });
    }

    await orderService.deleteOrder(orderId);

    info(`Order deleted successfully - OrderID: ${orderId}, User: ${req.user.id}`);
    return res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (err) {
    error(`Failed to delete order - OrderID: ${req.params.id}, User: ${req.user.id}, Error: ${err.message}`);
    console.error("Error in handleDeleteOrder:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

module.exports = {
  handleCreateOrder,
  handleGetAllOrders,
  handleGetOrderById,
  handleGetUserOrders,
  handleUpdateOrderStatus,
  handleUpdatePaymentStatus,
  handleDeleteOrder,
};