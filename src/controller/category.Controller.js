const Category = require("../models/categoryModel");
const ApiError = require("../utils/ApiError");

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check for duplicates
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({ name });
    await newCategory.save();

    res.status(201).json({ message: "Category created successfully", newCategory });
  } catch (error) {
    res.status(500).json({ message: "Failed to create category", error: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    if (categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};


// shanky | making get api to fetch fixed category that we will provide in api only 

const getFixedCategoryController = async (req,res) =>{

  try{
    //fixed category that we want to send from this get api
    const categories = ["Grocery", "Bakery", "Pharmacy", "Electronics", "Mobile & Accessories", 
                        "Clothing", "Footwear", "Home Appliances", "Furniture", "Stationery",
                      "Toys & Games", "Books", "Beauty & Cosmetics", "Jewelry", 
                      "Sports & Fitness", "Pet Supplies", "Automobile Accessories",
                       "Hardware & Tools", "Florist", "Gift Shop", "Restaurant", "Cafe",
                        "Fast Food", "Street Food", "Sweet Shop", "Tailor", "Salon/Barber",
                         "Dry Cleaner", "Computer Repair", "Mobile Repair", "Fruits",
                          "Vegetables", "Leafy Greens", "Herbs", "Bread", "Buns", "Cakes",
                           "Cookies", "Pastries", "Chicken", "Mutton", "Fish", "Eggs",
                            "Prawns", "Milk", "Curd", "Butter", "Cheese", "Ghee", 
                            "Cooking Oil (Sunflower, Mustard, Coconut, etc.)", 
                            "Rice (Basmati, Sona Masoori, etc.)", "Wheat Flour (Atta)",
                             "Pulses (Toor Dal, Moong Dal, Chana Dal, etc.)", "Lentils", 
                             "Biscuits", "Noodles", "Pasta", "Snacks", "Ready-to-eat meals", 
                             "Tea", "Coffee", "Soft Drinks", "Juices", "Energy Drinks", 
                             "Salt", "Sugar", "Turmeric", "Chilli Powder", "Garam Masala",
                              "Pickles", "Soap", "Shampoo", "Toothpaste", "Sanitary Pads",
                               "Shaving Cream", "Detergents", "Dishwash Liquid", 
                               "Toilet Cleaner", "Air Fresheners", "Tissues"];

            res.status(200).json({categories});

  }catch(error){

    res.status(500).json({message :"something went wrong while fetching the categories.."})
  }
}




module.exports = {
  createCategory,
  getCategories,
  getFixedCategoryController
};








