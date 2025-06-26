const productModel = require("../models/product");
const shopModel = require("../models/storeModel");
const { StatusCodes } = require("http-status-codes");
const productService = require("../service/product.service");
const { info, error, debug } = require("../middleware/logger");
const Shop = require("../models/storeModel");
const User = require("../models/user");
const Product = require("../models/product");
const admin = require("../config/admin");
const Notification = require("../models/notificationModel");

// =================================================================================================
// ====================================== 🟢 CREATE PRODUCT =========================================
// =================================================================================================
const handleCreateProduct = async (req, res) => {
  // ===================================== 🔍 INPUT VALIDATION =====================================
  const { adminId, userId } = req.body;

  if (!adminId && !userId) {
    return res.status(400).json({ message: "Either adminId or userId is required" });
  }

  try {
    // ===================================== 📂 FILE LOGGING ========================================
    console.log(`File received for product: ${req.file?.originalname || "no file"}`);

    // ===================================== 🛠️ PRODUCT DATA PREP ==================================
    const productData = {
      ...req.body,
      adminId: adminId || undefined,
      userId: userId || undefined,
    };

    // ===================================== 📦 CREATE PRODUCT ======================================
    const newProduct = await productService.createProduct(productData, req.file);
    console.log(`Product created successfully - ID: ${newProduct._id}, Name: ${newProduct.name}`);

    // ===================================== 📝 LOG BODY FIELDS =====================================
    info(`Request body fields: [${Object.keys(req.body).join(", ")}]`);

    // ===================================== 📱 GET FCM USERS =======================================
    const users = await User.find({ fcmTokens: { $exists: true, $ne: [] } });
    const allTokens = users.flatMap(user => user.fcmTokens);

    // ===================================== 🔔 SEND FCM NOTIFICATION ================================
    let fcmSummary = {};
    if (allTokens.length > 0) {
      const message = {
        notification: {
          title: "🆕 New Product Added!",
          body: `Introducing "${newProduct.name}". Check it out now!`,
        },
        tokens: allTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      fcmSummary = {
        totalSent: allTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };

      // info("✅ FCM Notification Summary:");
      // info(`Total Sent: ${fcmSummary.totalSent}`);
      // info(`Success Count: ${fcmSummary.successCount}`);
      // info(`Failure Count: ${fcmSummary.failureCount}`);
    } else {
      info("No FCM tokens found. Notification not sent.");
    }

    // ===================================== 💾 SAVE NOTIFICATION TO DB ==============================
    const notificationDoc = new Notification({
      title: "🆕 New Product Added!",
      body: `Introducing "${newProduct.name}". Check it out now!`,
      type: "new_product",
      recipients: users.map((user) => ({
        userId: user._id,
        isRead: false,
      })),
      data: {
        productId: newProduct._id,
        productName: newProduct.name,
      },
    });

    await notificationDoc.save();

    // ===================================== ✅ SEND FINAL RESPONSE ==================================
    res.status(201).json({
      message: "Product created",
      product: newProduct,
      notification: fcmSummary,
    });

  } catch ({ statusCode = 500, message }) {
    // ===================================== ❌ ERROR HANDLING ======================================
    error(`Product creation failed - Error: ${message}`);
    res.status(statusCode).json({ message });
  }
};

// this is for admin pannel only - cz here we send the banned shop products too but in user module we dont want to send the banned shop products
const AdminGetAllProducts = async (req, res) => {
  const requesterId = req.user?.id || "unknown";
  const queryParams = req.query;

  debug(
    `Get all products request - User: ${requesterId}, Filters: ${JSON.stringify(
      queryParams
    )}`
  );

  try {
    const { products, pagination } = await productService.getAllProducts(
      queryParams
    );

    info(
      `Products fetched successfully - Count: ${products.length}, Page: ${pagination.currentPage}, User: ${requesterId}`
    );
    return res.status(200).json({
      message: "Products fetched successfully",
      products,
      pagination,
    });
  } catch (err) {
    error(
      `Failed to fetch products - User: ${requesterId}, Error: ${err.message}`
    );
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

// for used module cz here we will remove the product who belongs to the shop that is banned by the admin 
// | cz admin can see all type of shop and products but user can see only that are not banned
const handleGetAllProducts = async (req, res) => {
  const requesterId = req.user?.id || "unknown";
  const queryParams = req.query;

  debug(
    `Get all products request - User: ${requesterId}, Filters: ${JSON.stringify(
      queryParams
    )}`
  );

  try {
    const { products, pagination } = await productService.getAllProducts(
      queryParams
    );

    // ✅ Filter out products whose shop is banned
    const filteredProducts = products.filter(
      (product) => product.shop && product.shop.isBanned === false
    );

    info(
      `Products fetched successfully - Count: ${filteredProducts.length}, Page: ${pagination.currentPage}, User: ${requesterId}`
    );

    return res.status(200).json({
      message: "Products fetched successfully",
      products: filteredProducts,
      pagination,
    });
  } catch (err) {
    error(
      `Failed to fetch products - User: ${requesterId}, Error: ${err.message}`
    );
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleGetProductById = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user?.id || "unknown";

  debug(`Get product by ID request - ID: ${id}, User: ${requesterId}`);

  try {
    const product = await productService.getProductById(id);

    info(
      `Product fetched successfully - ID: ${id}, Name: ${product.name}, User: ${requesterId}`
    );
    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (err) {
    error(
      `Failed to fetch product - ID: ${id}, User: ${requesterId}, Error: ${err.message}`
    );
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const getProductsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);

    console.log(`Fetching shops and products for userId: ${userId}`);

    // Step 1: Fetch the shop(s) owned by the user
    const shops = await Shop.find({ owner: userId });
    if (!shops.length) {
      return res.status(404).json({ message: "No shops found for this user" });
    }

    // Step 2: Get all shop IDs
    const shopIds = shops.map((shop) => shop._id);

    // Step 3: Get all products under those shops
    const products = await productModel.find({ shop: { $in: shopIds } });
    // Step 4: Format result with just shopName and its products
    const result = shops.map((shop) => {
      const shopProducts = products.filter(
        (product) => product.shop.toString() === shop._id.toString()
      );
      return {
        shopName: shop.shopName,
        products: shopProducts,
      };
    });

    res.status(200).json({
      message: "Shops and products fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(`Error fetching shop and products: ${error.message}`);
    res.status(500).json({
      message: "Failed to fetch shop and products",
      error: error.message,
    });
  }
};

const handleUpdateProductById = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user?.id || "unknown";
  const productData = req.body;


console.log("Incoming update body:", req.body);


  debug(
    `Update product request - ID: ${id}, Admin: ${adminId}, Fields: ${Object.keys(
      productData
    ).join(", ")}`
  );

  try {
    // Call the update function
    const updatedProduct = await productService.updateProductById(
      id,
      productData
    );

    info(
      `Product updated successfully - ID: ${id}, Name: ${updatedProduct.name}, Admin: ${adminId}`
    );
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    error(
      `Failed to update product - ID: ${id}, Admin: ${adminId}, Error: ${err.message}`
    );
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const handleDeleteProductById = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user?.id || "unknown";

  debug(`Delete product request - ID: ${id}, Admin: ${adminId}`);

  try {
    await productService.deleteProductById(id);

    info(`Product deleted successfully - ID: ${id}, Admin: ${adminId}`);
    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    error(
      `Failed to delete product - ID: ${id}, Admin: ${adminId}, Error: ${err.message}`
    );
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
};

const getProductsByShopId = async (req, res) => {
  try {
    const { shopId } = req.params; // Get shopId from URL

    console.log(`Fetching products for shopId: ${shopId}`);

    // Fetch products with matching shopId
    const products = await productModel.find({ shop: shopId });

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for this shop" });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error(`Error fetching products by shopId: ${error.message}`);
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

//-------------------------------------------------------------------------------------------
// location

// shanky | comparing user and shop location to show only those shop products thats matches the user's location.. 
async function getNearbyProductsController(req, res) {
  try {
    const { userId } = req.params;

    // Load the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find shops matching location and not banned
    const matchingShops = await Shop.find({
      state: new RegExp(`^${user.state}$`, 'i'),
      pinCode: user.pincode,
      isBanned: false // ✅ exclude banned shops
    }).select("_id");

    const shopIds = matchingShops.map((s) => s._id);
    if (!shopIds.length) {
      return res
        .status(200)
        .json({ message: "No shops in your area", products: [] });
    }

    // Fetch products from allowed shops
    const products = await Product.find({ shop: { $in: shopIds } })
      .populate("shop", "shopName state place locality pinCode")
      .exec();

    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
}

// search bar filter controller which sends the product when we search either product namr or locality or place

const searchProducts = async (req, res) => {
  const { productName, location } = req.params;

  const validProductName = productName && productName !== "null" && productName !== "undefined";
  const validLocation = location && location !== "null" && location !== "undefined";

  if (!validProductName && !validLocation) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Please provide at least one search term in the params: productName or location.",
    });
  }

  try {
    let products = [];

    // 🔍 If both productName and location are provided
    if (validProductName && validLocation) {
      const shopRegex = new RegExp(location, "i");

      const matchingShops = await shopModel.find({
        isBanned: false, // ✅ Only include non-banned shops
        $or: [{ locality: { $regex: shopRegex } }, { place: { $regex: shopRegex } }],
      }, "_id");

      if (matchingShops.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "No shops found for the given location.",
        });
      }

      const shopIds = matchingShops.map(shop => shop._id);
      const nameRegex = new RegExp(productName, "i");

      products = await productModel.find({
        name: { $regex: nameRegex },
        shop: { $in: shopIds },
      });

      return res.status(StatusCodes.OK).json({ success: true, data: products });
    }

    // 🔍 If only productName is provided
    if (validProductName) {
      const nameRegex = new RegExp(productName, "i");

      const all = await productModel.find({ name: { $regex: nameRegex } })
        .populate("shop", "isBanned");

      // ✅ Filter products from non-banned shops only
      products = all.filter(p => p.shop && !p.shop.isBanned);

      return res.status(StatusCodes.OK).json({ success: true, data: products });
    }

    // 🔍 If only location is provided
    if (validLocation) {
      const shopRegex = new RegExp(location, "i");

      const matchingShops = await shopModel.find({
        isBanned: false, // ✅ Only include non-banned shops
        $or: [{ locality: { $regex: shopRegex } }, { place: { $regex: shopRegex } }],
      }, "_id");

      if (matchingShops.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "No shops found for the given location.",
        });
      }

      const shopIds = matchingShops.map(shop => shop._id);
      products = await productModel.find({ shop: { $in: shopIds } });

      return res.status(StatusCodes.OK).json({ success: true, data: products });
    }

  } catch (err) {
    console.error(`Search error - ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};



module.exports = {
  handleCreateProduct,
  AdminGetAllProducts,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProductById,
  handleDeleteProductById,
  getProductsByUserId,
  getProductsByShopId,
  getNearbyProductsController,   // this is the location comparing controller for hompage products
  searchProducts
};








