// controllers/favoriteController.js

const User = require('../models/user');
const Product = require('../models/product');

// Add a product to favorites
async function addFavoriteController(req, res) {
  try {
    const { userId, productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.favorites.includes(productId)) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    user.favorites.push(productId);
    await user.save();

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Remove a product from favorites
async function removeFavoriteController(req, res) {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get all favorite products
async function getFavoritesController(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('favorites').exec();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  addFavoriteController,
  removeFavoriteController,
  getFavoritesController,
};
