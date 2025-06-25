const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const DeliveryAddress = require("../models/deliveryAddressmodel");
const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmailToShopOwner = async (shopEmail, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Cosysta App" <${process.env.EMAIL_ID}>`,
    to: shopEmail,
    subject,
    html: htmlContent,
  });
};

const placeOrderController = async (req, res) => {
  try {
    const { items, addressId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const addressDoc = await DeliveryAddress.findOne({ userId });
    const selectedAddress = addressDoc?.addresses?.id(addressId);

    if (!selectedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    const populatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId).populate("shop");
        if (!product) throw new Error("Product not found");
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          totalAmount: product.price * item.quantity,
          shop: product.shop,
        };
      })
    );

    const totalCartAmount = populatedItems.reduce((sum, i) => sum + i.totalAmount, 0);

    // Group by shop
    const shopWiseMap = new Map();
    populatedItems.forEach((item) => {
      const shopId = item.shop._id.toString();
      if (!shopWiseMap.has(shopId)) {
        shopWiseMap.set(shopId, {
          shop: item.shop,
          items: [],
        });
      }
      shopWiseMap.get(shopId).items.push(item);
    });

    // Send emails per shop owner
    for (let [shopId, data] of shopWiseMap.entries()) {
      const ownerEmail = data.shop.email;

      const html = `
        <h2>🛒 New Order Received</h2>

        <h3>👤 Customer Details</h3>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Mobile:</strong> ${user.mobileNumber}</p>

        <h3>📦 Delivery Address</h3>
        <p>
          Country: ${selectedAddress.countryName}<br>
          State: ${selectedAddress.state}<br>
          Town/City: ${selectedAddress.town}<br>
          Area: ${selectedAddress.area}<br>
          Landmark: ${selectedAddress.landmark || "N/A"}<br>
          Pincode: ${selectedAddress.pincode}<br>
          House No: ${selectedAddress.houseNo || "N/A"}
        </p>

        <h3>🧾 Ordered Products</h3>
        ${data.items.map(i => `
          <p>
            <strong>Product Name:</strong> ${i.name}<br>
            <strong>Product Price (per unit):</strong> ₹${i.price}<br>
            <strong>Quantity:</strong> ${i.quantity}<br>
            <strong>Total for this product:</strong> ₹${i.totalAmount}
          </p>
          <hr>
        `).join("")}

        <h3>💰 Total Order Amount: ₹${data.items.reduce((sum, i) => sum + i.totalAmount, 0)}</h3>
      `;

      await sendEmailToShopOwner(ownerEmail, "New Order from Cosysta", html);
    }

    // Save order
    const order = new Order({
      userId,
      address: selectedAddress,
      items: populatedItems.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        totalAmount: i.totalAmount,
        shop: i.shop._id
      })),
      totalCartAmount,
    });

    await order.save();

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Order error:", err.message);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
};

module.exports = {
  placeOrderController,
};






















// const orderService = require("../service/order.service");
// const { info, error, debug } = require("../middleware/logger");

// const handleCreateOrder = async (req, res) => {
//   try {
//     const orderData = req.body;
//     orderData.userId = req.user.id;

//     debug(`Order creation attempt - User: ${orderData.userId}`);

//     const order = await orderService.createOrder(orderData);
//     info(`Order created successfully - User: ${orderData.userId}, OrderID: ${order._id}`);
//     return res.status(201).json({
//       message: "Order created successfully",
//       order,
//     });
//   } catch (err) {
//     error(`Failed to create order - User: ${req.user.id}, Error: ${err.message}`);
//     console.error("Error in handleCreateOrder:", err);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// const handleGetAllOrders = async (req, res) => {
//   try {
//     debug(`Fetching all orders - Query params: ${JSON.stringify(req.query)}`);
//     const queryParams = req.query;
//     const { orders, pagination } = await orderService.getAllOrders(queryParams);
//     info(`All orders fetched successfully - Count: ${orders.length}`);
//     return res.status(200).json({
//       message: "Orders fetched successfully",
//       orders,
//       pagination,
//     });
//   } catch (err) {
//     error(`Failed to fetch all orders - Error: ${err.message}`);
//     console.error("Error in handleGetAllOrders:", err);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// const handleGetOrderById = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const userId = req.user.id;
    
//     debug(`Fetching order by ID - OrderID: ${orderId}, User: ${userId}`);

//     const order = await orderService.getOrderById(orderId);

//     if (req.user.role !== "admin" && order.userId._id.toString() !== userId.toString()) {
//       info(`Unauthorized access attempt to order - OrderID: ${orderId}, User: ${userId}, Role: ${req.user.role}`);
//       return res.status(403).json({
//         message: "You do not have permission to view this order",
//       });
//     }

//     info(`Order fetched successfully - OrderID: ${orderId}, User: ${userId}`);
//     return res.status(200).json({
//       message: "Order fetched successfully",
//       order,
//     });
//   } catch (err) {
//     error(`Failed to fetch order by ID - OrderID: ${req.params.orderId}, User: ${req.user.id}, Error: ${err.message}`);
//     console.error("Error in handleGetOrderById:", err);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// const handleGetUserOrders = async (req, res) => {
//   try {
//     const authUserId = req.user.id.toString(); 
//     const authUserRole = req.user.role; 
//     const requestedUserId = req.params.userId || authUserId;
    
//     debug(`Fetching user orders - RequestedUserID: ${requestedUserId}, AuthUserID: ${authUserId}, Role: ${authUserRole}`);

//     if (authUserId !== requestedUserId && authUserRole !== "admin") {
//       info(`Unauthorized access attempt to user orders - RequestedUserID: ${requestedUserId}, AuthUserID: ${authUserId}, Role: ${authUserRole}`);
//       return res.status(403).json({
//         message: "You do not have permission to view these orders",
//       });
//     }

//     const queryParams = req.query;
//     const { orders, pagination } = await orderService.getOrdersByUser(
//       requestedUserId,
//       queryParams
//     );

//     info(`User orders fetched successfully - UserID: ${requestedUserId}, Count: ${orders.length}`);
//     return res.status(200).json({
//       message: "User orders fetched successfully",
//       orders,
//       pagination,
//     });
//   } catch (err) {
//     error(`Failed to fetch user orders - RequestedUserID: ${req.params.userId || req.user.id}, Error: ${err.message}`);
//     console.error("Error in handleGetUserOrders:", err.stack);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// const handleUpdateOrderStatus = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { status } = req.body;
    
//     debug(`Updating order status - OrderID: ${orderId}, Status: ${status}, User: ${req.user.id}, Role: ${req.user.role}`);

//     // if (req.user.role !== 'admin' && req.user.role !== 'staff') {
//     //   return res.status(403).json({
//     //     message: "You do not have permission to update order status"
//     //   });
//     // }

//     const updatedOrder = await orderService.updateOrderStatus(orderId, status);

//     info(`Order status updated successfully - OrderID: ${orderId}, Status: ${status}, User: ${req.user.id}`);
//     return res.status(200).json({
//       message: "Order status updated successfully",
//       order: updatedOrder,
//     });
//   } catch (err) {
//     error(`Failed to update order status - OrderID: ${req.params.id}, User: ${req.user.id}, Error: ${err.message}`);
//     console.error("Error in handleUpdateOrderStatus:", err);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// const handleUpdatePaymentStatus = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { paymentStatus } = req.body;
    
//     debug(`Updating payment status - OrderID: ${orderId}, PaymentStatus: ${paymentStatus}, User: ${req.user.id}, Role: ${req.user.role}`);

//     // Only admin or authorized staff can update payment status
//     // if (req.user.role !== 'admin' && req.user.role !== 'staff') {
//     //   return res.status(403).json({
//     //     message: "You do not have permission to update payment status"
//     //   });
//     // }

//     const updatedOrder = await orderService.updatePaymentStatus(
//       orderId,
//       paymentStatus
//     );

//     info(`Payment status updated successfully - OrderID: ${orderId}, PaymentStatus: ${paymentStatus}, User: ${req.user.id}`);
//     return res.status(200).json({
//       message: "Payment status updated successfully",
//       order: updatedOrder,
//     });
//   } catch (err) {
//     error(`Failed to update payment status - OrderID: ${req.params.id}, User: ${req.user.id}, Error: ${err.message}`);
//     console.error("Error in handleUpdatePaymentStatus:", err);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// const handleDeleteOrder = async (req, res) => {
//   try {
//     const orderId = req.params.id;
    
//     debug(`Order deletion attempt - OrderID: ${orderId}, User: ${req.user.id}, Role: ${req.user.role}`);
    
//     if (req.user.role !== "admin") {
//       info(`Unauthorized delete attempt - OrderID: ${orderId}, User: ${req.user.id}, Role: ${req.user.role}`);
//       return res.status(403).json({
//         message: "You do not have permission to delete orders",
//       });
//     }

//     await orderService.deleteOrder(orderId);

//     info(`Order deleted successfully - OrderID: ${orderId}, User: ${req.user.id}`);
//     return res.status(200).json({
//       message: "Order deleted successfully",
//     });
//   } catch (err) {
//     error(`Failed to delete order - OrderID: ${req.params.id}, User: ${req.user.id}, Error: ${err.message}`);
//     console.error("Error in handleDeleteOrder:", err);
//     return res.status(err.statusCode || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// module.exports = {
//   handleCreateOrder,
//   handleGetAllOrders,
//   handleGetOrderById,
//   handleGetUserOrders,
//   handleUpdateOrderStatus,
//   handleUpdatePaymentStatus,
//   handleDeleteOrder,
// };