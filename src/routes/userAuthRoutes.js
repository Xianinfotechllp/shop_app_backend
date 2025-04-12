const express = require('express');
const router = express.Router();
const { handleUserRegistration, handleUserLogin } = require("../controller/userAuth.controller");

router.post("/register",handleUserRegistration);
router.post("/login",handleUserLogin);

module.exports = router;