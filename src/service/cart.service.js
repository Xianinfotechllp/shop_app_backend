const GenericRepo = require("../repository/genericRepository");
const cartModel = require("../models/cart");
const { validateCartSchema } = require("../utils/validator");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

const getCartByUserId = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid User ID format:", userId);
      return null;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log("🔍 Searching for cart with userId:", userObjectId);

    let cart = cartModel.findOne({ userId: userObjectId }).populate({
      path: "items.productId",
      select: "productImage name price",
    });

    if (!cart) {
      console.warn("No cart found for user. Returning empty cart.");
      return null;
    }

    return cart;
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    throw new ApiError(500, "Internal Server Error");
  }
};

const createOrUpdateCart = async (userId, cartData) => {
  const { error, value } = validateCartSchema(cartData);
  if (error) throw new ApiError(400, error.details[0].message);

  let existingCart = await getCartByUserId(userId);

  console.log("create service:", userId);

  if (existingCart) {
    existingCart.items = value.items;
    return await GenericRepo.update(cartModel, existingCart._id, existingCart);
  } else {
    return await GenericRepo.create(cartModel, { userId, ...value });
  }
};

const removeProductFromCart = async (userId, productId, quantityToRemove) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const cart = await cartModel.findOne({ userId: userObjectId });

  if (!cart) {
    return null;
  }

  let productIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (productIndex === -1) {
    return "PRODUCT_NOT_FOUND";
  }

  if (cart.items[productIndex].quantity > quantityToRemove) {
    cart.items[productIndex].quantity -= quantityToRemove;
  } else {
    cart.items.splice(productIndex, 1);
  }

  if (cart.items.length === 0) {
    await cartModel.deleteOne({ userId: userObjectId });
    return { message: "Cart deleted as it became empty" };
  }

  await cart.save();
  return cart;
};

const deleteCart = async (userId) => {
  return await GenericRepo.delete(cartModel, { userId });
};

module.exports = {
  getCartByUserId,
  createOrUpdateCart,
  deleteCart,
  removeProductFromCart,
};
