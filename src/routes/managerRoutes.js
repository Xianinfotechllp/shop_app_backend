const express = require('express');
const {
  registerManager,
  loginManager
} = require('../controller/Manager.controller'); // adjust path if needed

const {verifyManager,verifySalesman,verifyToken} = require("../middleware/verifyToken");

const router = express.Router();

// ✅ Base: /api/manager
router.post('/register',registerManager);
router.post('/login', loginManager);
router.get('/test-token',verifyToken,verifyManager, (req,res)=>{

  res.send("test pass");
})

module.exports = router;
