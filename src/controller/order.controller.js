const Order = require("../models/order");
const User = require("../models/user");
const Shop = require("../models/storeModel");
const Product = require("../models/product");
const DeliveryAddress = require("../models/deliveryAddressmodel");
const Notification = require("../models/notificationModel");
const nodemailer = require("nodemailer");
require("dotenv").config();

// =================================================================================================
// ============================== 📧 SEND EMAIL TO SHOP OWNER =======================================
// =================================================================================================
const sendEmailToShopOwner = async (shopEmail, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Shop App" <${process.env.EMAIL_ID}>`,
    to: shopEmail,
    subject,
    html: htmlContent,
  });
};

// =================================================================================================
// ============================== 🛒 PLACE ORDER CONTROLLER =========================================
// =================================================================================================
const placeOrderController = async (req, res) => {
  try {
    const { items, addressId, totalCartAmount } = req.body;
    const userId = req.user.id;

    // =============================================================================================
    // 🔍 FETCH USER & DELIVERY ADDRESS
    // =============================================================================================
    const user = await User.findById(userId);
    const addressDoc = await DeliveryAddress.findOne({ userId });
    const selectedAddress = addressDoc?.addresses?.id(addressId);

    if (!selectedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    // =============================================================================================
    // 📦 Get full product and shop details for each item
    // =============================================================================================
    const populatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error("Product not found");

        const shop = await Shop.findById(product.shop);
        return {
          productId: product._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          priceWithQuantity: item.priceWithQuantity,
          weightInGrams: item.weightInGrams,
          shop,
        };
      })
    );

    // =============================================================================================
    // 🗂️ Group all items shop-wise (so we know which shop gets which products)
    // =============================================================================================
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

    // =============================================================================================
    // 📧 SEND EMAILS TO SHOP OWNERS
    // =============================================================================================
    for (let [shopId, data] of shopWiseMap.entries()) {
      const ownerEmail = data.shop.email;

      const html = `
        <h2>🛒 New Order Received</h2>
        <h3>👤 Customer Details</h3>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Mobile:</strong> ${selectedAddress.phoneNumber}</p>

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
            ${i.weightInGrams ? `<strong>Weight:</strong> ${i.weightInGrams} grams<br>` : ""}
            <strong>Total for this product:</strong> ₹${i.priceWithQuantity}
          </p><hr>
        `).join("")}

        <h3>💰 Total Order Amount: ₹${data.items.reduce((sum, i) => sum + i.priceWithQuantity, 0)}</h3>
      `;

      await sendEmailToShopOwner(ownerEmail, "New Order from Cosysta", html);
    }

    // =============================================================================================
    // 📝 SAVE ORDER TO DB
    // =============================================================================================
    const order = new Order({
      userId,
      address: selectedAddress,
      items: populatedItems.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        priceWithQuantity: i.priceWithQuantity,
        weightInGrams: i.weightInGrams,
        shop: i.shop._id,
      })),
      totalCartAmount,
    });

    await order.save();

    // =============================================================================================
    // 🔻 UPDATE PRODUCT STOCK AFTER ORDER
    // =============================================================================================
    for (let item of populatedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const type = product.productType?.toLowerCase();

      if (type === "per kg") {
        // ➕ Calculate total grams to reduce from stock
        let totalGrams = item.weightInGrams      // // If weight in grams is given (e.g., 250g), then:
          ? item.weightInGrams * item.quantity  // // Multiply weightInGrams × quantity (e.g., 250g × 2 = 500g)
          : item.quantity * 1000;               // If not given, assume 1 quantity = 1kg → convert to grams (e.g., 2 × 1000 = 2000g)
                                                // ℹitem.quantity here means how much user is buying
                                                  //    (not the stock in product model, which is handled separately)
         
// item.quantity in order is different it is the quantity user wants to buy and it can be the quantity of grams packet too e.g- 250 grams * 2 quantity = 500 grams
// product.quantity is different it is the product available stock that shop owner has , we are reducing this with the help of calculating ( item.quantity )
// 🔴🔴🔴 if order item comes in grams which is less than 1kg and cant be taken as 1 full quantity
// 🔴🔴🔴 so we have to caluculate and reduct product quantity i.e stock according to grams also
// 🔴🔴🔴 example product quantity = 9.75  if we buy 250 grams from the product quanatiy available in = 10 so it will be calculated as 9.75 
//  1 kg = 1 quantity here  , 1 unit = 1 quantity , 1 pack = 1 quantity  this quantity is not order item quantity this is present in prodoct model it tells us about the product stock availabe to sell..
// but in kg 'only' user can give the weight in grams and we have to calculate when it will be 1 quantity(stock) 
// in other product type we dont need to calculate we can directly reduce
//  the product quantity(stock) in product model - cz (1 item.quantity = 1 product.quantity i.e (stock) ) 
                                                  
        const currentStockInGrams = product.quantity * 1000; // Convert current stock to grams
        const newStockInGrams = currentStockInGrams - totalGrams;

        // Convert grams back to kg and update product.quantity
        // If newStockInGrams > 0, set quantity = newStockInGrams / 1000
        // Else, set quantity = 0 (no negative stock)
        product.quantity = newStockInGrams > 0 ? newStockInGrams / 1000 : 0;
      } else {
        // For "Per Pack" or "Per Unit", just reduce quantity directly
        product.quantity = Math.max(0, product.quantity - item.quantity);
      }

      await product.save();
    }

    // =============================================================================================
    // 📈 UPDATE PRODUCT SOLD QUANTITY
    // =============================================================================================
    for (let item of populatedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const type = product.productType?.toLowerCase();

      if (type === "per kg") {
        //  Calculate total grams sold
       let totalGrams = item.weightInGrams          // If weight in grams is given (e.g., 250g), then:
       ? item.weightInGrams * item.quantity         // Multiply weightInGrams × quantity (e.g., 250g × 2 = 500g)
       : item.quantity * 1000;                      // If not given, assume 1 quantity = 1kg → convert to grams (e.g., 2 × 1000 = 2000g)
                                                  // ℹitem.quantity here means how much user is buying
                                                  //    (not the stock in product model, which is handled separately)

//  1 kg = 1 quantity here  , 1 unit = 1 quantity , 1 pack = 1 sold 
// but in kg 'only' user can give the weight in grams and we have to calculate when it will be 1 sold 
// in other product type we dont need to calculate we can directly include there ordered quantity as sold



        const soldInKg = totalGrams / 1000; // Convert grams to kg
        product.sold += soldInKg; // Add to sold field
      } else {
        // For pack or unit-based products, increase sold directly
        product.sold += item.quantity;
      }

      await product.save();
    }

    // =============================================================================================
    // 🔔 SAVE NOTIFICATION TO DATABASE OF ORDERS FOR SHOP OWNERS
    // =============================================================================================
    const uniqueShopIds = [...new Set(populatedItems.map(i => i.shop._id.toString()))];
    const shops = await Shop.find({ _id: { $in: uniqueShopIds } });

    for (let shop of shops) {
      const notificationDoc = new Notification({
        title: "🛒 New Order Alert!",
        body: `🎉 You received a new order from ${user.name} on ${order.createdAt}. Check your email for full details.`,
        type: "order",
        recipients: [
          {
            userId: shop.owner,
            isRead: false,
          },
        ],
        data: {
          orderId: order._id,
          shopId: shop._id,
          userName: user.name,
          orderTime: order.createdAt,
        },
      });

      await notificationDoc.save();
    }

    // =============================================================================================
    // ✅ RESPONSE
    // =============================================================================================
    res.status(200).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Order error:", err.message);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
};


// get api for the order summary | about the orders user has given and when he will click on them we will send the product details from another api..
const handleGetUserOrdersSummary = async (req, res) => {
  const userId = req.params.userId;

  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

    const summarizedOrders = orders.map((order) => {
      const productNames = order.items.map((item) => ({
        name: item.name || "Product Deleted",
      }));

      return {
        orderId: order._id,
        userId: order.userId,
        createdAt: order.createdAt,
        products: productNames, // ✅ already correct format
        totalCartAmount: order.totalCartAmount,
      };
    });

    return res.status(200).json({
      message: "User orders fetched successfully",
      userId,
      orders: summarizedOrders,
    });
  } catch (err) {
    console.error("Error fetching user orders summary:", err.message);
    return res.status(500).json({
      message: "Failed to fetch user orders",
      error: err.message,
    });
  }
};


// in this controller we will show the whole order detail when we click on order - so we can see the whole product details

const UserOrderProductsDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const detailedItems = await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        const shop = product ? await Shop.findById(product.shop).lean() : null;

        return {
          productName: item.name || product?.name || "Product Deleted",
          productImage: product?.productImage || "N/A", // optional, fallback to product DB image
          productPrice: item.price !== undefined ? item.price : "N/A", // ✅ from order
          quantityBought: item.quantity || "N/A",
          weightInGrams: item.weightInGrams || null,
          totalPrice: item.priceWithQuantity !== undefined ? item.priceWithQuantity : "N/A", // ✅ from order
          shopName: shop?.shopName || "Shop Deleted",
          shopEmail: shop?.email || "N/A",
          // shopMobile: shop?.mobileNumber || "N/A",
        };
      })
    );

    return res.status(200).json({
      orderId: order._id,
      userId: order.userId,
      totalCartAmount: order.totalCartAmount || "N/A",
      createdAt: order.createdAt,
      address: order.address,
      products: detailedItems,
    });
  } catch (err) {
    console.error("Error fetching order details:", err.message);
    return res.status(500).json({
      message: "Failed to fetch order details",
      error: err.message,
    });
  }
};




module.exports = {
  placeOrderController,
  handleGetUserOrdersSummary,
  UserOrderProductsDetails
};





// -- ----- working order place controller before the product stock and sold calculations ------------------------


// const placeOrderController = async (req, res) => {
//   try {
//     const { items, addressId, totalCartAmount } = req.body;
//     const userId = req.user.id;

//     // =============================================================================================
//     // 🔍 FETCH USER & DELIVERY ADDRESS
//     // =============================================================================================
//     const user = await User.findById(userId);
//     const addressDoc = await DeliveryAddress.findOne({ userId });
//     const selectedAddress = addressDoc?.addresses?.id(addressId);

//     if (!selectedAddress) {
//       return res.status(404).json({ message: "Address not found" });
//     }

//     // =============================================================================================
//     // 📦 Get full product and shop details for each item
//     // =============================================================================================
//     const populatedItems = await Promise.all(
//       items.map(async (item) => {
//         const product = await Product.findById(item.productId);
//         if (!product) throw new Error("Product not found");

//         const shop = await Shop.findById(product.shop);
//         return {
//           productId: product._id,
//           name: item.name,
//           price: item.price,
//           quantity: item.quantity,
//           priceWithQuantity: item.priceWithQuantity,
//           weightInGrams: item.weightInGrams,
//           shop, // includes _id, email, owner
//         };
//       })
//     );

//     // =============================================================================================
//     // 🗂️ Group all items shop-wise (so we know which shop gets which products)
//     // =============================================================================================
//     const shopWiseMap = new Map();
//     populatedItems.forEach((item) => {
//       const shopId = item.shop._id.toString();
//       if (!shopWiseMap.has(shopId)) {
//         shopWiseMap.set(shopId, {
//           shop: item.shop,
//           items: [],
//         });
//       }
//       shopWiseMap.get(shopId).items.push(item);
//     });

//     // =============================================================================================
//     // 📧 SEND EMAILS TO SHOP OWNERS
//     // =============================================================================================
//     for (let [shopId, data] of shopWiseMap.entries()) {
//       const ownerEmail = data.shop.email;

//       const html = `
//         <h2>🛒 New Order Received</h2>
//         <h3>👤 Customer Details</h3>
//         <p><strong>Name:</strong> ${user.name}</p>
//         <p><strong>Email:</strong> ${user.email}</p>
//         <p><strong>Mobile:</strong> ${selectedAddress.phoneNumber}</p>

//         <h3>📦 Delivery Address</h3>
//         <p>
//           Country: ${selectedAddress.countryName}<br>
//           State: ${selectedAddress.state}<br>
//           Town/City: ${selectedAddress.town}<br>
//           Area: ${selectedAddress.area}<br>
//           Landmark: ${selectedAddress.landmark || "N/A"}<br>
//           Pincode: ${selectedAddress.pincode}<br>
//           House No: ${selectedAddress.houseNo || "N/A"}
//         </p>

//         <h3>🧾 Ordered Products</h3>
//         ${data.items.map(i => `
//           <p>
//             <strong>Product Name:</strong> ${i.name}<br>
//             <strong>Product Price (per unit):</strong> ₹${i.price}<br>
//             <strong>Quantity:</strong> ${i.quantity}<br>
//             ${i.weightInGrams ? `<strong>Weight:</strong> ${i.weightInGrams} grams<br>` : ""}
//             <strong>Total for this product:</strong> ₹${i.priceWithQuantity}
//           </p><hr>
//         `).join("")}

//         <h3>💰 Total Order Amount: ₹${data.items.reduce((sum, i) => sum + i.priceWithQuantity, 0)}</h3>
//       `;

//       await sendEmailToShopOwner(ownerEmail, "New Order from Cosysta", html);
//     }

//     // =============================================================================================
//     // 📝 SAVE ORDER TO DB
//     // =============================================================================================
//     const order = new Order({
//       userId,
//       address: selectedAddress,
//       items: populatedItems.map(i => ({
//         productId: i.productId,
//         name: i.name,
//         price: i.price,
//         quantity: i.quantity,
//         priceWithQuantity: i.priceWithQuantity,
//         weightInGrams: i.weightInGrams,
//         shop: i.shop._id,
//       })),
//       totalCartAmount,
//     });

//     await order.save();

//     // =============================================================================================
//     // 🔔 SAVE NOTIFICATION TO DATABASE OF ORDERS FOR SHOP OWNERS
//     // =============================================================================================
//     const uniqueShopIds = [...new Set(populatedItems.map(i => i.shop._id.toString()))];
//     const shops = await Shop.find({ _id: { $in: uniqueShopIds } });

//     for (let shop of shops) {
//       const notificationDoc = new Notification({
//         title: "🛒 New Order Alert!",
//         body: `🎉 You received a new order from ${user.name} on ${order.createdAt}. Check your email for full details.`,
//         type: "order",
//         recipients: [
//           {
//             userId: shop.owner,
//             isRead: false,
//           },
//         ],
//         data: {
//           orderId: order._id,
//           shopId: shop._id,
//           userName: user.name,
//           orderTime: order.createdAt,
//         },
//       });

//       await notificationDoc.save();
//     }

//     // =============================================================================================
//     // ✅ RESPONSE
//     // =============================================================================================
//     res.status(200).json({ message: "Order placed successfully", order });
//   } catch (err) {
//     console.error("Order error:", err.message);
//     res.status(500).json({ message: "Failed to place order", error: err.message });
//   }
// };




//------- end of working order place controller before the product stock and sold calculations -----------------------------


//----------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------



//------------ ----------- previous developer code not mine and not useful right now------------------


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