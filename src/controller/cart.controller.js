const cartService = require("../service/cart.service");
const { StatusCodes } = require("http-status-codes");
const mongoose = require('mongoose');
const { info, error, debug } = require("../middleware/logger");

const handleGetCartByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    debug(`Fetching cart - UserID: ${userId}`);

    const cart = await cartService.getCartByUserId(userId);

    if (!cart) {
      info(`Cart not found - UserID: ${userId}`);
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Cart not found" });
    }

    info(`Cart fetched successfully - UserID: ${userId}`);
    res.status(StatusCodes.OK).json({
      message: "Cart fetched successfully",
      cart,
    });
  } catch (err) {
    error(`Failed to fetch cart - UserID: ${req.user.id}, Error: ${err.message}`);
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ message });
  }
};

const handleCreateOrUpdateCart = async (req, res) => {
  try {
    let userId = req.user.id; 
    const cartData = req.body;
    console.log(cartData);
    
    debug(`Creating/updating cart - UserID: ${userId}`);
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      info(`Invalid User ID format - UserID: ${userId}`);
      return res.status(400).json({ message: "Invalid User ID Format" });
    }

    const updatedCart = await cartService.createOrUpdateCart(userId, cartData);
    
    info(`Cart updated successfully - UserID: ${userId}`);
    res.status(StatusCodes.OK).json({
      message: "Cart updated successfully",
      cart: updatedCart,
    });
  } catch (err) {
    error(`Failed to create/update cart - UserID: ${req.user.id}, Error: ${err.message}`);
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ message });
  }
};

const handleRemoveProductFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body; 
    
    debug(`Removing product from cart - UserID: ${userId}, ProductID: ${productId}, Quantity: ${quantity}`);
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      info(`Invalid user ID format - UserID: ${userId}`);
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid user ID format" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      info(`Invalid product ID format - ProductID: ${productId}`);
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid product ID format" });
    }
    
    if (!quantity || quantity <= 0) {
      info(`Invalid quantity to remove - Quantity: ${quantity}`);
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid quantity to remove" });
    }
    
    const updatedCart = await cartService.removeProductFromCart(userId, productId, quantity);
    
    if (updatedCart === null) {
      info(`Cart not found while removing product - UserID: ${userId}`);
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Cart not found" });
    }
    
    if (updatedCart === "PRODUCT_NOT_FOUND") {
      info(`Product not found in cart - UserID: ${userId}, ProductID: ${productId}`);
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found in cart" });
    }
    
    info(`Product removed from cart - UserID: ${userId}, ProductID: ${productId}, Quantity: ${quantity}`);
    res.status(StatusCodes.OK).json({
      message: "Product quantity updated in cart",
      cart: updatedCart,
    });
  } catch (err) {
    error(`Failed to remove product from cart - UserID: ${req.user.id}, ProductID: ${req.params.productId}, Error: ${err.message}`);
    console.error("Error removing product from cart:", err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
  }
};

const handleDeleteCart = async (req, res) => {
  try {
    const { userId } = req.params;
    debug(`Deleting cart - UserID: ${userId}`);
    
    await cartService.deleteCart(userId);
    
    info(`Cart deleted successfully - UserID: ${userId}`);
    res.status(StatusCodes.OK).json({
      message: "Cart deleted successfully",
    });
  } catch (err) {
    error(`Failed to delete cart - UserID: ${req.params.userId}, Error: ${err.message}`);
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ message });
  }
};

module.exports = {
  handleGetCartByUserId,
  handleCreateOrUpdateCart,
  handleRemoveProductFromCart,
  handleDeleteCart,
};