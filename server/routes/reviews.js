const express = require('express');
const router = express.Router();
const { run, get } = require('../database');

router.post('/', async (req, res) => {
    const { customer_id, restaurant_id, order_id, rating, food_quality_rating, value_rating, pickup_rating, packaging_rating, review_text } = req.body;
    try {
        if (![customer_id, restaurant_id, order_id].every(Number.isInteger) || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Valid order, customer, restaurant, and 1-5 rating are required' });
        const order = await get('SELECT customer_id, food_batch_id, status FROM orders WHERE id = ?', [order_id]);
        if (!order || order.customer_id !== customer_id || order.status !== 'COMPLETED' && order.status !== 'DELIVERED') return res.status(400).json({ error: 'Only completed orders can be reviewed' });
        const batch = await get('SELECT restaurant_id FROM food_batches WHERE id = ?', [order.food_batch_id]);
        if (!batch || batch.restaurant_id !== restaurant_id) return res.status(400).json({ error: 'Review does not match the order restaurant' });
        // Prevent duplicate reviews for the same order
        const existing = await get('SELECT id FROM reviews WHERE order_id = ?', [order_id]);
        if (existing) {
            return res.status(400).json({ error: 'Review already submitted for this order' });
        }

        const result = await run(
            'INSERT INTO reviews (customer_id, restaurant_id, order_id, rating, food_quality_rating, value_rating, pickup_rating, packaging_rating, review_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customer_id, restaurant_id, order_id, rating, food_quality_rating, value_rating, pickup_rating, packaging_rating, review_text]
        );
        
        // Update restaurant average rating
        await run(`
            UPDATE restaurants 
            SET 
                rating = (SELECT AVG(rating) FROM reviews WHERE restaurant_id = ?),
                total_reviews = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = ?)
            WHERE id = ?
        `, [restaurant_id, restaurant_id, restaurant_id]);

        // Auto-report low ratings
        if (parseInt(rating) <= 2) {
            await run(
                'INSERT INTO reports (customer_id, restaurant_id, order_id, category, description) VALUES (?, ?, ?, ?, ?)',
                [customer_id, restaurant_id, order_id, 'LOW_RATING_REVIEW', `Auto-generated report from a ${rating}-star review: ${review_text || 'No comment provided'}`]
            );
        }

        res.status(201).json({ id: result.lastID, message: 'Review submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

module.exports = router;
