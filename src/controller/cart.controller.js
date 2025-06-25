const cartModel = require('../models/cart');
const productModel = require('../models/product');

//  Add to Cart
const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const product = await productModel.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const productPrice = product.price;
    const totalProductPrice = productPrice * quantity;

    let cart = await cartModel.findOne({ userId });

    if (!cart) {
      cart = new cartModel({
        userId,
        items: [{
          productId,
          quantity,
          productPrice,
          totalProductPrice
        }],
        totalCartPrice: totalProductPrice
      });
    } else {
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        return res.status(400).json({
          message: 'This product is already in your cart. Please check your cart.'
        });
      } else {
        cart.items.push({ productId, quantity, productPrice, totalProductPrice });
        cart.totalCartPrice += totalProductPrice;
      }
    }

    await cart.save();
    res.status(200).json({ message: 'Product added to cart successfully', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

// when we will increase quantity of product it will revaluate the price of products and cart and send the response

const updateCartQuantityController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await cartModel.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Product not found in cart' });

    const product = await productModel.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found in DB' });

    // Remove old product total from cart total
    cart.totalCartPrice -= item.totalProductPrice;

    // Update quantity and prices
    item.quantity = quantity;
    item.productPrice = product.price;
    item.totalProductPrice = product.price * quantity;

    // Add updated product total back to cart total
    cart.totalCartPrice += item.totalProductPrice;

    await cart.save();
    res.status(200).json({ message: 'Cart updated successfully', cart });

  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

//  Get Cart Items
const getCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ message: 'Cart is empty', cart: null });
    }

    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

//  Remove Item from Cart
const removeCartItemController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await cartModel.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemToRemove = cart.items.find(item => item.productId.toString() === productId);
    if (!itemToRemove) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    cart.totalCartPrice -= itemToRemove.totalProductPrice;
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    await cart.save();
    res.status(200).json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item', error: error.message });
  }
};

module.exports = {
  addToCartController,
  updateCartQuantityController,
  getCartController,
  removeCartItemController
};











//---------------------------------------------------------------------------------------------

// const cartService = require("../service/cart.service");
// const { StatusCodes } = require("http-status-codes");
// const mongoose = require('mongoose');
// const { info, error, debug } = require("../middleware/logger");

// const handleGetCartByUserId = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     debug(`Fetching cart - UserID: ${userId}`);

//     const cart = await cartService.getCartByUserId(userId);

//     if (!cart) {
//       info(`Cart not found - UserID: ${userId}`);
//       return res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: "Cart not found" });
//     }

//     info(`Cart fetched successfully - UserID: ${userId}`);
//     res.status(StatusCodes.OK).json({
//       message: "Cart fetched successfully",
//       cart,
//     });
//   } catch (err) {
//     error(`Failed to fetch cart - UserID: ${req.user.id}, Error: ${err.message}`);
//     const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
//     const message = err.message || "Internal Server Error";
//     res.status(statusCode).json({ message });
//   }
// };

// const handleCreateOrUpdateCart = async (req, res) => {
//   try {
//     let userId = req.user.id; 
//     const cartData = req.body;
//     console.log(cartData);
    
//     debug(`Creating/updating cart - UserID: ${userId}`);
    
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       info(`Invalid User ID format - UserID: ${userId}`);
//       return res.status(400).json({ message: "Invalid User ID Format" });
//     }

//     const updatedCart = await cartService.createOrUpdateCart(userId, cartData);
    
//     info(`Cart updated successfully - UserID: ${userId}`);
//     res.status(StatusCodes.OK).json({
//       message: "Cart updated successfully",
//       cart: updatedCart,
//     });
//   } catch (err) {
//     error(`Failed to create/update cart - UserID: ${req.user.id}, Error: ${err.message}`);
//     const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
//     const message = err.message || "Internal Server Error";
//     res.status(statusCode).json({ message });
//   }
// };

// const handleRemoveProductFromCart = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { productId } = req.params;
//     const { quantity } = req.body; 
    
//     debug(`Removing product from cart - UserID: ${userId}, ProductID: ${productId}, Quantity: ${quantity}`);
    
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       info(`Invalid user ID format - UserID: ${userId}`);
//       return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid user ID format" });
//     }
    
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       info(`Invalid product ID format - ProductID: ${productId}`);
//       return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid product ID format" });
//     }
    
//     if (!quantity || quantity <= 0) {
//       info(`Invalid quantity to remove - Quantity: ${quantity}`);
//       return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid quantity to remove" });
//     }
    
//     const updatedCart = await cartService.removeProductFromCart(userId, productId, quantity);
    
//     if (updatedCart === null) {
//       info(`Cart not found while removing product - UserID: ${userId}`);
//       return res.status(StatusCodes.NOT_FOUND).json({ message: "Cart not found" });
//     }
    
//     if (updatedCart === "PRODUCT_NOT_FOUND") {
//       info(`Product not found in cart - UserID: ${userId}, ProductID: ${productId}`);
//       return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found in cart" });
//     }
    
//     info(`Product removed from cart - UserID: ${userId}, ProductID: ${productId}, Quantity: ${quantity}`);
//     res.status(StatusCodes.OK).json({
//       message: "Product quantity updated in cart",
//       cart: updatedCart,
//     });
//   } catch (err) {
//     error(`Failed to remove product from cart - UserID: ${req.user.id}, ProductID: ${req.params.productId}, Error: ${err.message}`);
//     console.error("Error removing product from cart:", err.message);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
//   }
// };

// const handleDeleteCart = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     debug(`Deleting cart - UserID: ${userId}`);
    
//     await cartService.deleteCart(userId);
    
//     info(`Cart deleted successfully - UserID: ${userId}`);
//     res.status(StatusCodes.OK).json({
//       message: "Cart deleted successfully",
//     });
//   } catch (err) {
//     error(`Failed to delete cart - UserID: ${req.params.userId}, Error: ${err.message}`);
//     const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
//     const message = err.message || "Internal Server Error";
//     res.status(statusCode).json({ message });
//   }
// };

// module.exports = {
//   handleGetCartByUserId,
//   handleCreateOrUpdateCart,
//   handleRemoveProductFromCart,
//   handleDeleteCart,
// };