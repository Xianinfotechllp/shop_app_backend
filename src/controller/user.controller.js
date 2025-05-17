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

// shanky | GET user's location (state, locality, pincode)
const getUserLocation = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.userId);  // Get user by ID from request params
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { state, locality, pincode } = user;
    res.json({
      success: true,
      message: "User location fetched successfully",
      location: { state, locality, pincode },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// shanky | PUT to update user's location (state, locality, pincode)
const updateUserLocation = async (req, res) => {
  const { state, locality, pincode } = req.body;

  // Check if at least one field is provided to update
  if (!state && !locality && !pincode) {
    return res.status(400).json({ success: false, message: "At least one field must be provided for update" });
  }

  try {
    const user = await userModel.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Only update the fields that are provided in the request body
    if (state) user.state = state;
    if (locality) user.locality = locality;
    if (pincode) user.pincode = pincode;

    await user.save(); // Save the updated user

    res.json({
      success: true,
      message: "User location updated successfully",
      location: { state: user.state, locality: user.locality, pincode: user.pincode },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// this is the user details api --
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



module.exports = {
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
  getUserLocation,
  updateUserLocation,
  getUserDetailsController
};