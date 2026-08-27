const express = require('express');
const router = express.Router();
const { 
    getRestaurantProfile, 
    getMenu, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    getAnalytics, 
    submitVerification,
    getReviews
} = require('../controllers/restaurantController');

router.get('/:id', getRestaurantProfile);
router.get('/:id/menu', getMenu);
router.post('/menu', addMenuItem);
router.put('/menu/:itemId', updateMenuItem);
router.delete('/menu/:itemId', deleteMenuItem);
router.get('/:id/analytics', getAnalytics);
router.post('/:id/verification', submitVerification);
router.get('/:id/reviews', getReviews);

module.exports = router;
