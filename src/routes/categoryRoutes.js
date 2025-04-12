const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
} = require("../controller/category.Controller");

// Route to create a new category
router.post("/", createCategory);

// Route to get all categories
router.get("/", getCategories);

module.exports = router;
