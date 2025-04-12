const express = require("express");
const router = express.Router();
const {
  handleGetAllUsers,
  handleGetUserById,
  handleUpdateUser,
} = require("../controller/user.controller");
const { verifyToken } = require("../middleware/verifyToken");

router.get("/", verifyToken,handleGetAllUsers);
router.get("/:id", handleGetUserById);
router.put("/edit", verifyToken, handleUpdateUser);

module.exports = router;
