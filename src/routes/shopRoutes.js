const express = require("express");
const router = express.Router();
const shopController = require("../controller/shop.Controller");
const upload = require("../middleware/multer");
const { verifyToken } = require("../middleware/verifyToken");

// CRUD routes
router.post("/", upload.single("headerImage"), shopController.createShop); // Create shop
router.get("/", shopController.getShops); // Get all shops
router.get("/nearby/:userId", shopController.getNearbyShops);
router.get("/by-user", verifyToken, shopController.getShopByUser);
router.get("/:id", shopController.getShopById); // Get shop by ID
router.put("/:id",verifyToken,upload.single("headerImage"),shopController.updateShop); // Update shop by ID
router.delete("/:id", shopController.deleteShop); // Delete shop by ID



module.exports = router;
