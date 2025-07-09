const Shop = require("../models/storeModel");
const ApiError = require("../utils/ApiError");
const cloudinary = require("cloudinary");
const fs = require("fs");
const { info, error } = require("../middleware/logger");
const { StatusCodes } = require("http-status-codes");
const userModel = require("../models/user");
const Notification = require("../models/notificationModel"); // ✅ Add this
const admin = require("../config/admin");
const Salesman = require("../models/Salesman.model");

// ✅ Create Shop 

const createShop = async (req, res) => {
  try {
    const {
      shopName,
      category,
      sellerType,
      state,
      locality,
      place,
      pinCode,
      userId,
      email,
      mobileNumber,
      landlineNumber,
      agentCode, // ✅ optional field
    } = req.body;

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "shops",
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    // ✅ Check if agent code matches any Salesman
    let matchedSalesman = null;
    if (agentCode) {
      matchedSalesman = await Salesman.findOne({ agentCode: agentCode });
    }

    // ✅ Create shop
    const newShop = new Shop({
      shopName,
      category: Array.isArray(category) ? category : [category],
      sellerType,
      state,
      locality,
      place,
      pinCode,
      headerImage: imageUrl,
      owner: userId,
      email,
      mobileNumber,
      landlineNumber,
      agentCode,
      registeredBySalesman: matchedSalesman ? matchedSalesman._id : null,
    });

    await newShop.save();

    // ✅ Link shop to Salesman (if matched)
    if (matchedSalesman) {
      matchedSalesman.shopsAddedBySalesman.push(newShop._id);
      await matchedSalesman.save();
    }

    // 🔔 Send FCM Notification
    const users = await userModel.find({ fcmTokens: { $exists: true, $ne: [] } });
    const allTokens = users.flatMap((user) => user.fcmTokens);
    let fcmResponse = null;

    if (allTokens.length > 0) {
      const message = {
        notification: {
          title: "🛍️ New Shop Alert!",
          body: `Check out new shop "${shopName}". Explore now!`,
        },
        tokens: allTokens,
      };
      fcmResponse = await admin.messaging().sendEachForMulticast(message);
      info(`✅ FCM Notification Summary:\nTotal Sent: ${allTokens.length}\nSuccess Count: ${fcmResponse.successCount}\nFailure Count: ${fcmResponse.failureCount}`);
    }

    // 💾 Save notification
    const notificationDoc = new Notification({
      title: "🛍️ New Shop Alert!",
      body: `Check out new shop "${shopName}". Explore now!`,
      type: "new_shop",
      recipients: users.map((user) => ({
        userId: user._id,
        isRead: false,
      })),
      data: {
        shopId: newShop._id,
        shopName: shopName,
      },
    });

    await notificationDoc.save();

    res.status(StatusCodes.CREATED).json({
      message: "Shop created successfully",
      shop: newShop,
      fcm: {
        successCount: fcmResponse?.successCount || 0,
        failureCount: fcmResponse?.failureCount || 0,
      },
    });

  } catch (err) {
    error("❌ Error in createShop:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Server error",
      error: err,
    });
  }
};


// get all shops for user module not for admin pannel

const getShops = async (req, res) => {
  try {
    const shops = await Shop.find({ isBanned: false }); // ✅ Exclude banned shops
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ admin pannel Get All Shops
const AdminGetAllShops = async (req, res) => {
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
    // debug(`Fetching shops - UserID: ${userId}`);

    const user = await userModel.findById(userId);
    console.log(user);

    if (!user || !user.id) {
      info(`User or pincode not found - UserID: ${userId}`);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "User pincode not found. Please update your location.",
      });
    }

    const shops = await Shop.find({ owner: user.id }).select(
      "_id shopName sellerType state locality place headerImage category pinCode agentCode registeredBySalesman"
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
    const { 
      shopName, 
      category, 
      sellerType, 
      state, 
      locality, 
      place, 
      pinCode,
      email,
      mobileNumber,
      landlineNumber
    } = req.body;

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
      email,
      mobileNumber,
      landlineNumber,
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

// finding shops based on user location that matches shop location on homescreen

const getNearbyShops = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find shops matching user's location and not banned
    const matchingShops = await Shop.find({
      state: new RegExp(`^${user.state}$`, "i"),
      pinCode: user.pincode,
      isBanned: false, // ✅ Only include non-banned shops
    });

    if (matchingShops.length === 0) {
      return res.status(200).json({ message: "No shops found in your area", shops: [] });
    }

    return res.status(200).json({ shops: matchingShops });
  } catch (err) {
    console.error("Error in getNearbyShops:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// @desc Search shops by name or category (case-insensitive)
// @route GET /api/shops/search/:term

// search bar for shop with sorting , if shop location and user location match
//  then in response those matched shop will show first in response before unmatched location shop
const searchShopController = async (req, res) => {
  try {
    const { term, userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    // 🔍 Case-insensitive search regex
    const regex = new RegExp(term, 'i');

    // 🔎 Find all matching shops
    const shops = await Shop.find({
       isBanned: false,                       // it will not include the banned shop in the search 
      $or: [
        { shopName: { $regex: regex } },
        { category: { $in: [regex] } }
      ]
    });

    // ✅ Sort shops: those matching user's location (state & pincode) first
    const sortedShops = shops.sort((a, b) => {
      const aMatch = a.state?.toLowerCase() === user.state.toLowerCase() && a.pinCode === user.pincode;
      const bMatch = b.state?.toLowerCase() === user.state.toLowerCase() && b.pinCode === user.pincode;

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    // 1. shops.sort((a, b) => {...})
    //This sorts the array shops.
    // Each a and b is a shop object being compared.
    // We define custom sorting by comparing how well each shop matches the user's location.

//     2. if (aMatch && !bMatch) return -1;
// Means: If Shop A matches and Shop B doesn't, then Shop A should come before B in the sorted list.

//     3. if (!aMatch && bMatch) return 1;
// Means: If Shop B matches and Shop A doesn't, then Shop B should come before A.

//     4. return 0;
// If both shops match or neither match, no change in their order.

    res.status(StatusCodes.OK).json({
      message: `${sortedShops.length} shops found`,
      shops: sortedShops,
    });

  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error searching for shops",
      error: error.message,
    });
  }
};

// admin pannel search shop controller is for the admin pannel few things are different here from previou one
const AdminsearchShopController = async (req, res) => {
  const { keyword } = req.params;

  try {
    const regex = new RegExp(keyword, 'i'); // case-insensitive match
    const shops = await Shop.find({
      $or: [
        { shopName: { $regex: regex } },
        { email: { $regex: regex } },
        { mobileNumber: { $regex: regex } },
      ],
    });

    res.status(200).json({ success: true, shops });
  } catch (error) {
    console.error('Shop search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};


// controller to change ban/active status of a shop from admin pannel
const AdminChangeShopBanStatus = async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    shop.isBanned = !shop.isBanned;
    await shop.save();

    res.status(200).json({ message: "Shop ban status updated", isBanned: shop.isBanned });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  createShop,
  getShops,
  AdminGetAllShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopByUser,
  getNearbyShops,
  searchShopController,
  AdminsearchShopController,
  AdminChangeShopBanStatus
};

