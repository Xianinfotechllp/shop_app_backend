const express = require('express')
const router = express.Router();
const {
    handleAdminLogin,
    handleAdminRegister
} = require('../controller/adminAuth.controller');

const { verifyAdmin } = require("../middleware/verifyToken");

router.post("/register",handleAdminRegister);
router.post("/login",handleAdminLogin);

module.exports = router;
