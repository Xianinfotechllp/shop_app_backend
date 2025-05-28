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
  getNearbyProductsController,
  searchProducts   
 // handleGetHomeProducts
} = require("../controller/product.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/", upload.single("productImage"), handleCreateProduct);
router.get("/getall", handleGetAllProducts);
router.get("/getone/:id", handleGetProductById);
router.get("/user/:userId", getProductsByUserId);
router.put("/update/:id",upload.single("productImage"), handleUpdateProductById);
router.delete("/:id", handleDeleteProductById);
router.get("/by-shopId/:shopId", getProductsByShopId);
router.get("/nearbyshop/:userId", getNearbyProductsController);  // shanky | location compare for homepage products route
router.get("/search/:productName/:location",  searchProducts);  // shanky | search filter route in homepage which sends product searching either - product name or locality or place 


module.exports = router;
