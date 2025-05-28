const productModel = require("../models/product");
const shopModel = require("../models/storeModel");
const { StatusCodes } = require("http-status-codes");
const productService = require("../service/product.service");
const { info, error, debug } = require("../middleware/logger");
const Shop = require("../models/storeModel");
const User = require("../models/user");    
const Product = require("../models/product");




const handleCreateProduct = async (req, res) => {
  const { adminId, userId } = req.body;

  // Ensure either adminId or userId is provided
  if (!adminId && !userId) {
    return res
      .status(400)
      .json({ message: "Either adminId or userId is required" });
  }

  try {
    console.log(
      `File received for product: ${req.file?.originalname || "no file"}`
    );

    const productData = {
      ...req.body,
      adminId: adminId || undefined,
      userId: userId || undefined,
    };

    const newProduct = await productService.createProduct(
      productData,
      req.file
    );

    console.log(
      `Product created successfully - ID: ${newProduct._id}, Name: ${newProduct.name}`
    );
    res.status(201).json({ message: "Product created", product: newProduct });
  } catch ({ statusCode = 500, message }) {
    console.error(`Product creation failed - Error: ${message}`);
    res.status(statusCode).json({ message });
  }
};

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

    //  Load the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    //  Find shops matching all 4 location fields  / made the search of location incase sensitive
    const matchingShops = await Shop.find({
  state:    new RegExp(`^${user.state}$`, 'i'),    // case-insensitive
  // place:    new RegExp(`^${user.place}$`, 'i'),    
  // locality: new RegExp(`^${user.locality}$`, 'i'),
  pinCode:  user.pincode,
}).select("_id");

    const shopIds = matchingShops.map((s) => s._id);
    if (!shopIds.length) {
      return res
        .status(200)
        .json({ message: "No shops in your area", products: [] });
    }

    //  Fetch products belonging to those shops
    const products = await Product.find({ shop: { $in: shopIds } })
      .populate("shop", "shopName state place locality pinCode")
      .exec();

    //  Return the filtered products
    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
}

// search bar filter controller which sends the product when we search either product namr or locality or place

const searchProducts = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Please provide a search term in the request body via `{ query: '...' }`",
    });
  }

  const regex = new RegExp(query, "i");
  debug(`Search query="${query}" by user=${req.user?.id || "guest"}`);

  try {
    // 1) Try matching product names
    let products = await productModel.find({ name: { $regex: regex } });
    if (products.length > 0) {
      info(`Found ${products.length} products by name="${query}"`);
      return res.status(StatusCodes.OK).json({ success: true, data: products });
    }

    // 2) Try matching shops by locality
    const shopsByLocality = await shopModel.find({ locality: { $regex: regex } }, "_id");
    if (shopsByLocality.length > 0) {
      const shopIds = shopsByLocality.map(s => s._id);
      products = await productModel.find({ shop: { $in: shopIds } });
      info(`Found ${products.length} products in locality="${query}"`);
      return res.status(StatusCodes.OK).json({ success: true, data: products });
    }

    // 3) Try matching shops by place
    const shopsByPlace = await shopModel.find({ place: { $regex: regex } }, "_id");
    if (shopsByPlace.length > 0) {
      const shopIds = shopsByPlace.map(s => s._id);
      products = await productModel.find({ shop: { $in: shopIds } });
      info(`Found ${products.length} products in place="${query}"`);
      return res.status(StatusCodes.OK).json({ success: true, data: products });
    }

    // nothing matched
    info(`No products found for query="${query}"`);
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, message: "No matching products found." });

  } catch (err) {
    error(`Search error query="${query}" - ${err.message}`);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};


module.exports = {
  handleCreateProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProductById,
  handleDeleteProductById,
  getProductsByUserId,
  getProductsByShopId,
  getNearbyProductsController,   // this is the location comparing controller for hompage products
  searchProducts
};








// //testing pincodeee producttt controllerrr
// const handleGetHomeProducts = async(req, res)=> {
//   try {
//     // 1. get user ID from JWT middleware
//     const userId = req.user.id;    //"67ed4d16df3f88efc6a24745"  checked it through this id cz idh user token

//     // 2. fetch user to read pincode
//     const user = await User.findById(userId).select("pincode");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userPincode = user.pincode;

//     // 3. find shops whose pinCode equals user.pincode
//     const shops = await Shop.find({ pinCode: userPincode }).select("_id");
//     if (shops.length === 0) {
//       return res
//         .status(200)
//         .json({ products: [], message: "No shops available in your area" });
//     }

//     const shopIds = shops.map((shop) => shop._id);

//     // 4. find products whose shop is in that list
//     const products = await Product.find({ shop: { $in: shopIds } })
//       .populate({
//         path: "shop",
//         select: "shopName state place pinCode",
//       })
//       .lean();

//     // 5. return the filtered products
//     return res.status(200).json({ products });
//   } catch (err) {
//     console.error("getHomeProducts error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// }
//testing github branch

