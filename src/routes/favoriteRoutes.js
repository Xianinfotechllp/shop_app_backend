// routes/favoriteRoutes.js

const express = require('express');
const router = express.Router();
const {
  addFavoriteController,
  removeFavoriteController,
  getFavoritesController,
} = require('../controller/favoriteController');

// Removed auth middleware since you are passing userId in params now

// Add favorite
router.post('/:userId/:productId', addFavoriteController);

// Remove favorite
router.delete('/:userId/:productId', removeFavoriteController);

// Get all favorites
router.get('/:userId', getFavoritesController);

module.exports = router;
