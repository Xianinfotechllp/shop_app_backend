const express = require("express");
const router = express.Router();
const {
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
  getUserLocation,
  updateUserLocation
} = require("../controller/user.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.get("/", verifyToken,handleGetAllUsers);
router.get("/:id", handleGetUserById);
router.put("/edit", verifyToken, handleUpdateUser);
router.get("/location/:userId", getUserLocation); // shanky | GET route to fetch user's location
router.put("/updatelocation/:userId", updateUserLocation); // shanky | PUT route to update user's location

module.exports = router;
