const userModel = require("../models/user");
const mongoose = require("mongoose");
const { updateUser } = require("../service/user.service");
const { StatusCodes } = require("http-status-codes");
const { info, error, debug } = require("../middleware/logger"); // Update path as needed


async function handleGetAllUsers(req, res) {
  const requesterId = req.user?.id || 'unknown';

  debug(`Get all users request by user: ${requesterId}`);

  try {
    const users = await userModel.find();

    if (users.length === 0) {
      info(`No users found in database - Request by: ${requesterId}`);
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "No users found" });
    }

    info(`Retrieved all users - Count: ${users.length}, Request by: ${requesterId}`);
    res.status(StatusCodes.OK).json({ success: true, data: users });
  } catch (err) {
    error(`Failed to get all users - Request by: ${requesterId}, Error: ${err.message}`);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function handleGetUserById(req, res) {
  const { id } = req.params;
  const requesterId = req.user?.id || 'unknown';

  debug(`Get user by ID request - Target ID: ${id}, Requester: ${requesterId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      info(`Invalid user ID format: ${id} - Request by: ${requesterId}`);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Invalid User ID Format" });
    }

    const user = await userModel.findById(id);

    if (!user) {
      info(`User not found - ID: ${id}, Request by: ${requesterId}`);
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    info(`User retrieved successfully - ID: ${id}, Request by: ${requesterId}`);
    res.status(StatusCodes.OK).json({ success: true, data: user });
  } catch (err) {
    error(`Failed to get user by ID - ID: ${id}, Request by: ${requesterId}, Error: ${err.message}`);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal Server Error" });
  }
}

const handleUpdateUser = async (req, res) => {
  const { id: targetUserId } = req.body;
  const updateData = req.body;
  const requester = req.user;
  const requesterId = requester?.id || 'unknown';

  debug(`Update user request - Target ID: ${targetUserId}, Requester: ${requesterId}, Role: ${requester?.role || 'unknown'}`);

  if (!requester || !requester.id) {
    info(`Unauthorized update attempt without valid token - Attempted target: ${targetUserId}`);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Unauthorized. Invalid or missing token.",
    });
  }

  const userIdToUpdate = requester.role === "admin" ? targetUserId : requester.id;

  if (!userIdToUpdate) {
    info(`User update failed - Missing user ID, Requester: ${requesterId}`);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "User ID is required for updating.",
    });
  }

  try {
    const updatedUser = await updateUser(userIdToUpdate, updateData, requester);

    info(`User updated successfully - ID: ${userIdToUpdate}, Updated by: ${requesterId}, Fields updated: ${Object.keys(updateData).join(', ')}`);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    error(`User update failed - ID: ${userIdToUpdate}, Requester: ${requesterId}, Error: ${err.message}`);
    return res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE - Delete user by ID
const deleteUserController = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const deletedUser = await userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};


// shanky | GET user's location (state, pincode)
// GET - Fetch user location
const getUserLocation = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { state, locality, place, pincode } = user;
    res.json({
      success: true,
      message: "User location fetched successfully",
      location: {
        state,
        locality,
        place,
        pincode,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT - Update user location
const updateUserLocation = async (req, res) => {
  const { state, locality, place, pincode } = req.body;

  if (!state && !locality && !place && !pincode) {
    return res.status(400).json({
      success: false,
      message: "At least one field must be provided for update",
    });
  }

  try {
    const user = await userModel.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (state) user.state = state;
    if (locality) user.locality = locality;
    if (place) user.place = place;
    if (pincode) user.pincode = pincode;

    await user.save();

    res.json({
      success: true,
      message: "User location updated successfully",
      location: {
        state: user.state,
        locality: user.locality,
        place: user.place,
        pincode: user.pincode,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Controller: Get full user details by user ID
const getUserDetailsController = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// controller to search user - on admin pannel
 const AdminsearchUserController = async (req, res) => {
  try {
    const keyword = req.params.keyword || "";

    const conditions = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } }
    ];

    // If keyword is a valid number, include mobileNumber match
    if (!isNaN(keyword)) {
      conditions.push({ mobileNumber: Number(keyword) });
    }

    const users = await userModel.find({
      $or: conditions
    });

    res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Error in searchUserController:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching users",
    });
  }
};

module.exports = {
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
  deleteUserController,
  getUserLocation,
  updateUserLocation,
  getUserDetailsController,
  AdminsearchUserController
};