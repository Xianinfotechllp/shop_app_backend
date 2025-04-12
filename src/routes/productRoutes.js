const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const {
  handleCreateProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProductById,
  handleDeleteProductById,
  getProductsByUserId,
  getProductsByShopId,   
 // handleGetHomeProducts
} = require("../controller/product.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/", upload.single("productImage"), handleCreateProduct);
router.get("/", handleGetAllProducts);
router.get("/:id", handleGetProductById);
router.get("/user/:userId", getProductsByUserId);
router.put("/update/:id", handleUpdateProductById);
router.delete("/:id", handleDeleteProductById);
router.get("/by-shopId/:shopId", getProductsByShopId);

// //testing pincodeee productsss
// router.get("/pincode/product",verifyToken,handleGetHomeProducts);

module.exports = router;
