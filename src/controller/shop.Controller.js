const Shop = require("../models/storeModel");
const ApiError = require("../utils/ApiError");
const cloudinary = require("cloudinary");
const fs = require("fs");
const { info, error, debug } = require("../middleware/logger");
const { StatusCodes } = require("http-status-codes");
const userModel = require("../models/user");
const admin = require("../config/admin");


// ✅ Create Shop 
// and with that also sending the fcm notification to all user about new shop , whenever a new shop is created
const createShop = async (req, res) => {
  try {
    const { shopName, category, sellerType, state, locality, place, pinCode, userId } = req.body;

    if (!req.file) throw new ApiError(400, "No image uploaded");

    // Upload image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: "shops",
    });

    // Remove local file
    fs.unlinkSync(req.file.path);

    // Create shop in DB
    const newShop = new Shop({
      shopName,
      category: Array.isArray(category) ? category : [category],
      sellerType,
      state,
      locality,
      place,
      pinCode,
      headerImage: result.secure_url,
      owner: userId,
    });

    await newShop.save();

    // 🔔 Prepare & send FCM notification
    const users = await userModel.find({ fcmTokens: { $exists: true, $ne: [] } });
    const allTokens = users.flatMap((user) => user.fcmTokens);

    let fcmResponse = null;

    if (allTokens.length > 0) {
      const message = {
        notification: {
          title: "🛍️ New Shop Alert!",
          body: `Check out new shop "${shopName}".Explore now!`,
        },
        tokens: allTokens,
      };

      fcmResponse = await admin.messaging().sendEachForMulticast(message);

      info(`✅ FCM Notification Summary:\nTotal Sent: ${allTokens.length}\nSuccess Count: ${fcmResponse.successCount}\nFailure Count: ${fcmResponse.failureCount}`);
    } else {
      info("ℹ️ No FCM tokens found. Notification not sent.");
    }

    // 🟢 Return response
    res.status(201).json({
      message: "Shop created successfully",
      shop: newShop,
      fcm: {
        successCount: fcmResponse?.successCount || 0,
        failureCount: fcmResponse?.failureCount || 0,
      },
    });

  } catch (err) {
    error("❌ Error in createShop:", err.message);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get All Shops
const getShops = async (req, res) => {
  try {
    const shops = await Shop.find();
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Single Shop by ID
const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) throw new ApiError(404, "Shop not found");

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Shop by User
const getShopByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    debug(`Fetching shops - UserID: ${userId}`);

    const user = await userModel.findById(userId);
    console.log(user);

    if (!user || !user.id) {
      info(`User or pincode not found - UserID: ${userId}`);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "User pincode not found. Please update your location.",
      });
    }

    const shops = await Shop.find({ owner: user.id }).select(
      "_id shopName sellerType state locality place headerImage category pinCode"
    );

    if (!shops || shops.length === 0) {
      info(`No shops found for user ${user.id} - UserID: ${userId}`);
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "No shops found in your account.",
      });
    }

    info(`Shops fetched - UserID: ${userId}`);
    return res.status(StatusCodes.OK).json({
      message: `Shops found in user ${userId}`,
      data: shops,
    });
  } catch (err) {
    error(`Failed to fetch shops - UserID: ${req.user.id}, Error: ${err.message}`);
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ message });
  }
};

// ✅ Update Shop by ID
const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopName, category, sellerType, state, locality, place, pinCode } = req.body;

    const shop = await Shop.findById(id);
    if (!shop) throw new ApiError(404, "Shop not found");

    let updatedData = {
      shopName,
      category: Array.isArray(category) ? category : [category],
      sellerType,
      state,
      locality,
      place,
      pinCode,
      owner: req.user?.id,
    };

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "shops",
      });

      fs.unlinkSync(req.file.path);
      updatedData.headerImage = result.secure_url;
    }

    const updatedShop = await Shop.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({ message: "Shop updated successfully", shop: updatedShop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Delete Shop by ID
const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);
    if (!shop) throw new ApiError(404, "Shop not found");

    await Shop.findByIdAndDelete(id);
    res.status(200).json({ message: "Shop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopByUser,
};

