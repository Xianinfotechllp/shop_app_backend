const orderModel = require("../models/order");
const productModel = require("../models/product");
const ApiError = require("../utils/ApiError");
const repository = require("../repository/genericRepository");
const mongoose = require('mongoose');

const createOrder = async (orderData) => {
  try {
    let calculatedTotal = 0;
    for (const item of orderData.items) {
      const product = await productModel.findById(item.productId);
      
      if (!product) {
        throw new ApiError(404, `Product with ID ${item.productId} not found`);
      }
      
      if (product.quantity < item.quantity) {
        throw new ApiError(400, `Insufficient quantity for product ${product.name}`);
      }
      
      item.name = product.name;
      item.price = product.price;
      
      calculatedTotal += product.price * item.quantity;
      
      await productModel.findByIdAndUpdate(product._id, {
        $inc: { quantity: -item.quantity, sold: item.quantity }
      });
    }
    
    if (Math.abs(orderData.totalAmount - calculatedTotal) > 0.01) {
      throw new ApiError(400, `Total amount mismatch. Expected: ${calculatedTotal}`);
    }
    
    return await repository.create(orderModel, orderData);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error creating order: ${error.message}`);
  }
};

const getAllOrders = async (queryParams) => {
  try {
    const query = {};
    const sort = {};
    const options = {};
    
    // Pagination
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    options.skip = (page - 1) * limit;
    options.limit = limit;
    
    // Filtering
    if (queryParams.userId) {
      query.userId = queryParams.userId;
    }
    
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    
    if (queryParams.paymentStatus) {
      query.paymentStatus = queryParams.paymentStatus;
    }
    
    if (queryParams.minTotal) {
      query.totalAmount = query.totalAmount || {};
      query.totalAmount.$gte = parseFloat(queryParams.minTotal);
    }
    
    if (queryParams.maxTotal) {
      query.totalAmount = query.totalAmount || {};
      query.totalAmount.$lte = parseFloat(queryParams.maxTotal);
    }
    
    // Date range filtering
    if (queryParams.startDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$gte = new Date(queryParams.startDate);
    }
    
    if (queryParams.endDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(queryParams.endDate);
    }
    
    // Sorting
    if (queryParams.sortBy) {
      sort[queryParams.sortBy] = queryParams.order === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }
    
    const populateOptions = [
      { path: 'userId', select: 'name email' }
    ];
    
    const orders = await orderModel.find(query)
      .sort(sort)
      .skip(options.skip)
      .limit(options.limit)
      .populate(populateOptions);
      
    const total = await orderModel.countDocuments(query);
    
    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new ApiError(500, `Error fetching orders: ${error.message}`);
  }
};

const getOrderById = async (orderId) => {
    try {
  
      if (typeof orderId === "object" && orderId.orderId) {
        orderId = orderId.orderId; 
      }
  
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID format");
      }
  
      const orderObjectId = new mongoose.Types.ObjectId(orderId);
  
      const order = await orderModel
        .findOne({ _id: orderObjectId })
        .populate({ path: "userId", select: "name email" });
  
      if (!order) {
        throw new ApiError(404, "Order not found");
      }
  
      return order;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error fetching order: ${error.message}`);
    }
  };
  
  

const getOrdersByUser = async (userId, queryParams = {}) => {
  try {
    const query = { userId };
    const sort = {};
    const options = {};
    
    // Pagination
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    options.skip = (page - 1) * limit;
    options.limit = limit;
    
    // Filtering
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    
    if (queryParams.paymentStatus) {
      query.paymentStatus = queryParams.paymentStatus;
    }
    
    // Sorting
    if (queryParams.sortBy) {
      sort[queryParams.sortBy] = queryParams.order === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }
    
    const orders = await orderModel.find(query)
      .sort(sort)
      .skip(options.skip)
      .limit(options.limit);
      
    const total = await orderModel.countDocuments(query);
    
    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new ApiError(500, `Error fetching user orders: ${error.message}`);
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const allowedStatuses = ["pending", "shipped", "delivered", "canceled"];
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
    }
    
    const updateData = { status };
    
    // If order is canceled, restore product quantities
    if (status === "canceled") {
      const order = await orderModel.findById(orderId);
      if (!order) {
        throw new ApiError(404, `Order not found`);
      }
      
      // Only restore quantities if the order wasn't already canceled
      if (order.status !== "canceled") {
        for (const item of order.items) {
          await productModel.findByIdAndUpdate(item.productId, {
            $inc: { quantity: item.quantity, sold: -item.quantity }
          });
        }
      }
    }
    
    return await repository.update(orderModel, orderId, updateData);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error updating order status: ${error.message}`);
  }
};

const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    const allowedStatuses = ["pending", "paid", "failed"];
    if (!allowedStatuses.includes(paymentStatus)) {
      throw new ApiError(400, `Invalid payment status. Allowed values: ${allowedStatuses.join(', ')}`);
    }
    
    return await repository.update(orderModel, orderId, { paymentStatus });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error updating payment status: ${error.message}`);
  }
};

const deleteOrder = async (orderId) => {
  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order not found`);
    }
    
    // If the order was not canceled already, restore product quantities
    if (order.status !== "canceled") {
      for (const item of order.items) {
        await productModel.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity, sold: -item.quantity }
        });
      }
    }
    
    return await repository.remove(orderModel, orderId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Error deleting order: ${error.message}`);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder
};