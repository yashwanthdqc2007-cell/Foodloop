const express = require('express');
const router = express.Router();
const { createOrder, getOrderById, updateOrderStatus, getRestaurantOrders } = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.get('/', getRestaurantOrders);

module.exports = router;
