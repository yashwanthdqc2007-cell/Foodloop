const express = require('express');
const router = express.Router();
const { run } = require('../database');

router.post('/', async (req, res) => {
    const { customer_id, restaurant_id, order_id, category, description } = req.body;
    try {
        const result = await run(
            'INSERT INTO reports (customer_id, restaurant_id, order_id, category, description) VALUES (?, ?, ?, ?, ?)',
            [customer_id, restaurant_id, order_id, category, description]
        );
        res.status(201).json({ id: result.lastID, message: 'Report submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

module.exports = router;
