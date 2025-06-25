const express = require("express");
const router = express.Router();
const { addToCartController,updateCartQuantityController ,getCartController, removeCartItemController } = require("../controller/cart.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.post('/add', verifyToken, addToCartController);
router.put('/update-quantity/:productId', verifyToken, updateCartQuantityController);
router.get('/', verifyToken, getCartController);
router.delete('/remove/:productId', verifyToken, removeCartItemController);

// router.post("/",verifyToken,handleCreateOrUpdateCart);
// router.get("/user",verifyToken,handleGetCartByUserId);
// router.put("/product/:productId",verifyToken,handleRemoveProductFromCart);

module.exports = router;