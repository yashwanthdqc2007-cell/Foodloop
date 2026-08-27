const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getOrders, getReviews } = require('../controllers/customerController');

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/orders', getOrders);
router.get('/reviews', getReviews);

module.exports = router;
