const { get, query, run } = require('../database');

const getProfile = async (req, res) => {
    const { id } = req.query; // Simple MVP auth simulation via query string
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    try {
        const user = await get('SELECT id, name, email, phone, location, food_preference, created_at FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const stats = await get(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(o.quantity) as meals_purchased,
                SUM(f.original_price * o.quantity - o.amount) as money_saved
            FROM orders o
            JOIN food_batches f ON o.food_batch_id = f.id
            WHERE o.customer_id = ?
        `, [id]);

        const reviewCount = await get('SELECT COUNT(*) as count FROM reviews WHERE customer_id = ?', [id]);

        res.json({
            ...user,
            stats: {
                totalOrders: stats.total_orders || 0,
                mealsPurchased: stats.meals_purchased || 0,
                moneySaved: stats.money_saved || 0,
                reviewsGiven: reviewCount.count || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateProfile = async (req, res) => {
    const { id, name, phone, location, food_preference } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    try {
        await run(
            'UPDATE users SET name = ?, phone = ?, location = ?, food_preference = ? WHERE id = ?',
            [name, phone, location, food_preference, id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const getOrders = async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    try {
        const orders = await query(`
            SELECT 
                o.id as order_id, 
                o.quantity, 
                o.amount, 
                o.status, 
                o.created_at,
                f.id as batch_id,
                f.food_name, 
                f.veg_type,
                r.id as restaurant_id,
                r.name as restaurant_name,
                (SELECT COUNT(*) FROM reviews rv WHERE rv.order_id = o.id) as has_review
            FROM orders o
            JOIN food_batches f ON o.food_batch_id = f.id
            JOIN restaurants r ON f.restaurant_id = r.id
            WHERE o.customer_id = ?
            ORDER BY o.created_at DESC
        `, [id]);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const getReviews = async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    try {
        const reviews = await query(`
            SELECT rv.*, r.name as restaurant_name 
            FROM reviews rv
            JOIN restaurants r ON rv.restaurant_id = r.id
            WHERE rv.customer_id = ?
            ORDER BY rv.created_at DESC
        `, [id]);
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getOrders,
    getReviews
};
