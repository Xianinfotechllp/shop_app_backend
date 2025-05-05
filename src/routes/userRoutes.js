const express = require("express");
const router = express.Router();
const {
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
  getUserLocation,
  updateUserLocation,
  getUserDetailsController
} = require("../controller/user.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.get("/", verifyToken,handleGetAllUsers);
router.get("/:id", handleGetUserById);
router.put("/edit", verifyToken, handleUpdateUser);
router.get("/location/:userId", getUserLocation); // shanky | GET route to fetch user's location
router.put("/updatelocation/:userId", updateUserLocation); // shanky | PUT route to update user's location
router.get("/details/:id", getUserDetailsController); // shanky | get route to send the user details

module.exports = router;
