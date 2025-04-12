const express = require('express');
const router = express.Router();
const{handleGetMetrics} =require("../controller/dashboard.controller");

router.get("/metrics",handleGetMetrics);

module.exports = router;
