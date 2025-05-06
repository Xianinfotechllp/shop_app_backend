const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getFixedCategoryController,
  getKeyFixedCategory
} = require("../controller/category.Controller");

// Route to create a new category
router.post("/", createCategory);

// Route to get all categories
router.get("/", getCategories);

// shanky | Route to fetch fixed categories 

router.get("/FixedCategory",getFixedCategoryController)

// shanky | Route to fetch some of categories which has key name with them so we can fetch both key name and value both
router.get("/Key/WithFixedCategory", getKeyFixedCategory);

module.exports = router;
