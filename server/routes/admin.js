const express = require('express');
const router = express.Router();
const { getAnalytics, getVerifications, updateVerification, getReports, updateReport, getCustomers, getReviews, updateRestaurantStatus, getRestaurants } = require('../controllers/adminController');

router.get('/analytics', getAnalytics);
router.get('/verifications', getVerifications);
router.put('/verifications/:id', updateVerification);
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.get('/customers', getCustomers);
router.get('/reviews', getReviews);
router.put('/restaurants/:id/status', updateRestaurantStatus);
router.get('/restaurants', getRestaurants);

module.exports = router;
