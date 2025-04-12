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

module.exports = {
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
};