const userModel = require("../models/user");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { validateUserSchema } = require("../utils/validator");

const updateUser = async (id, updateData, requester) => {
    try {
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new ApiError(400, "Update data cannot be empty");
      }
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid user ID format");
      }
  
      const { error, value } = validateUserSchema(updateData);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }
  
      const user = await userModel.findById(id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
  
      if (requester.role !== "admin" && requester.id !== id) {
        throw new ApiError(403, "Unauthorized to update this user");
      }
  
      if (value.password) {
        value.password = await bcrypt.hash(value.password, 10);
      }
  
      const updatedUser = await userModel.findByIdAndUpdate(id, value, { new: true });
  
      return updatedUser;
    } catch (error) {
      throw error;
    }
};
  
  
module.exports = {
  updateUser,
};
