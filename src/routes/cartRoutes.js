const express = require("express");
const router = express.Router();
const {
  handleCreateOrUpdateCart,
  handleGetCartByUserId,
  handleRemoveProductFromCart,
} = require("../controller/cart.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/",verifyToken,handleCreateOrUpdateCart);
router.get("/user",verifyToken,handleGetCartByUserId);
router.put("/product/:productId",verifyToken,handleRemoveProductFromCart);

module.exports = router;