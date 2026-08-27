const express = require('express');
const router = express.Router();
const { getMarketplaceFoods, getFoodById, createFoodBatch, allocateFoodBatch } = require('../controllers/foodController');

router.get('/', getMarketplaceFoods);
router.get('/:id', getFoodById);
router.post('/', createFoodBatch);
router.post('/:id/allocate', allocateFoodBatch);

module.exports = router;
