const { validateProductSchema } = require("../utils/validator");
const productModel = require("../models/product");
const GenericRepo = require("../repository/genericRepository");
const ApiError = require("../utils//ApiError");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');

const createProduct = async (productData, file) => {
  const { error, value } = validateProductSchema(productData);
  if (error) throw new ApiError(400, error.details[0].message);

 if (!file) throw new ApiError(400, "No file uploaded");

  // Upload the image to Cloudinary
  const result = await cloudinary.v2.uploader.upload(file.path, {
    folder: "products",
  });

  
  fs.unlinkSync(file.path);

  
  const newProduct = new productModel({
    ...value,
    productImage: result.secure_url,
  });

  return await newProduct.save();
};


const getAllProducts = async (queryParams) => {
  const query = {};
  const sort = {};
  const options = {};
  
  // Pagination
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  options.skip = (page - 1) * limit;
  options.limit = limit;
  
  // Search by name (case insensitive)
  if (queryParams.name) {
    query.name = { $regex: queryParams.name, $options: "i" }; 
  }
  
  // Price range filtering
  if (queryParams.minPrice || queryParams.maxPrice) {
    query.price = {};
    if (queryParams.minPrice) query.price.$gte = parseFloat(queryParams.minPrice);
    if (queryParams.maxPrice) query.price.$lte = parseFloat(queryParams.maxPrice);
  }
  
  // Category filtering
  if (queryParams.category) {
    query.category = { $regex: queryParams.category, $options: "i" };
  }
  
  // Quantity filtering
  if (queryParams.minQuantity || queryParams.maxQuantity) {
    query.quantity = {};
    if (queryParams.minQuantity) query.quantity.$gte = parseInt(queryParams.minQuantity);
    if (queryParams.maxQuantity) query.quantity.$lte = parseInt(queryParams.maxQuantity);
  }
  
  // Filter by availability (quantity > 0)
  if (queryParams.inStock === 'true') {
    query.quantity = { $gt: 0 };
  } else if (queryParams.inStock === 'false') {
    query.quantity = { $lte: 0 };
  }
  
  // Filter by popularity (sold count)
  if (queryParams.minSold) {
    query.sold = { $gte: parseInt(queryParams.minSold) };
  }
  
  // Text search across multiple fields
  if (queryParams.search) {
    query.$or = [
      { name: { $regex: queryParams.search, $options: "i" } },
      { description: { $regex: queryParams.search, $options: "i" } },
      { category: { $regex: queryParams.search, $options: "i" } }
    ];
  }
  
  // Sorting
  if (queryParams.sortBy) {
    // Handle special sort case for popularity
    if (queryParams.sortBy === 'popularity') {
      sort.sold = queryParams.order === "desc" ? -1 : 1;
    } else {
      sort[queryParams.sortBy] = queryParams.order === "desc" ? -1 : 1;
    }
  } else {
    // Default sort by most recently added
    sort.createdAt = -1;
  }
  
  // Execute query with pagination
  const products = await productModel.find(query).sort(sort).skip(options.skip).limit(options.limit);
  const total = await productModel.countDocuments(query);
  
  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getAllProducts,
};


const getProductById = async (productId) => {
  const product = await GenericRepo.getById(productModel, productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return product;
};

const updateProductById = async (productId, productData) => {
  const updatedProduct = await GenericRepo.update(
    productModel,
    productId,
    productData
  );
  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }
  return updatedProduct;
};

const deleteProductById = async (productId) => {
    const deletedProduct = await GenericRepo.remove(productModel, productId);
    if (!deletedProduct) {
      throw new ApiError(404, "Product not found");
    }
    return deletedProduct;
  };

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById
};
