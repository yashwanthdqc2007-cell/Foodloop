const express = require('express');
const router = express.Router();
const { classify, predictDemand, recommendAlloc } = require('../controllers/aiController');

router.post('/classify', classify);
router.post('/predict-demand', predictDemand);
router.post('/recommend-allocation', recommendAlloc);

module.exports = router;
