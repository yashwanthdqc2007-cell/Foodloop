const { get, query, run } = require('../database');

const getRestaurantProfile = async (req, res) => {
    try {
        const profile = await get('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
        if (!profile) return res.status(404).json({ error: 'Restaurant not found' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
};

const getMenu = async (req, res) => {
    try {
        const menu = await query('SELECT * FROM menu_items WHERE restaurant_id = ? AND active = 1', [req.params.id]);
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
};

const addMenuItem = async (req, res) => {
    const { restaurant_id, name, description, category, food_type, normal_price } = req.body;
    try {
        const result = await run(
            'INSERT INTO menu_items (restaurant_id, name, description, category, food_type, normal_price) VALUES (?, ?, ?, ?, ?, ?)',
            [restaurant_id, name, description, category, food_type, normal_price]
        );
        res.status(201).json({ id: result.lastID, message: 'Menu item added' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add menu item' });
    }
};

const updateMenuItem = async (req, res) => {
    const { name, description, category, food_type, normal_price, active } = req.body;
    try {
        await run(
            'UPDATE menu_items SET name=?, description=?, category=?, food_type=?, normal_price=?, active=? WHERE id=?',
            [name, description, category, food_type, normal_price, active, req.params.itemId]
        );
        res.json({ message: 'Menu item updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update menu item' });
    }
};

const deleteMenuItem = async (req, res) => {
    try {
        await run('UPDATE menu_items SET active = 0 WHERE id = ?', [req.params.itemId]);
        res.json({ message: 'Menu item deactivated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
};

const getAnalytics = async (req, res) => {
    const { id } = req.params; // restaurant_id
    try {
        const sales = await get(`
            SELECT 
                COALESCE(SUM(o.quantity), 0) as surplus_sales,
                SUM(o.amount) as revenue_recovered,
                SUM(f.original_price * o.quantity) as original_value
            FROM orders o
            JOIN food_batches f ON o.food_batch_id = f.id
            WHERE f.restaurant_id = ? AND o.status = 'COMPLETED'
        `, [id]);

        const donations = await get(`
            SELECT 
                SUM(m.quantity) as meals_donated
            FROM matches m
            JOIN food_batches f ON m.food_batch_id = f.id
            WHERE f.restaurant_id = ? AND m.status = 'CLAIMED'
        `, [id]);

        const batches = await get(`
            SELECT COUNT(*) as active_batches FROM food_batches WHERE restaurant_id = ? AND status = 'ACTIVE'
        `, [id]);

        const mealsDonated = donations.meals_donated || 0;
        const surplusSales = sales.surplus_sales || 0;
        const foodRescued = mealsDonated + surplusSales;

        res.json({
            revenueRecovered: sales.revenue_recovered || 0,
            originalValue: sales.original_value || 0,
            discountGiven: (sales.original_value || 0) - (sales.revenue_recovered || 0),
            surplusSales: surplusSales,
            mealsDonated: mealsDonated,
            foodRescued: foodRescued,
            activeBatches: batches.active_batches || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

const submitVerification = async (req, res) => {
    const { fssai_number } = req.body;
    try {
        await run('UPDATE restaurants SET fssai_number = ?, verification_status = ? WHERE id = ?', [fssai_number, 'PENDING', req.params.id]);
        res.json({ message: 'Verification submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit verification' });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await query(`
            SELECT r.*, u.name as customer_name 
            FROM reviews r 
            JOIN users u ON r.customer_id = u.id 
            WHERE r.restaurant_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.id]);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

module.exports = {
    getRestaurantProfile,
    getMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAnalytics,
    submitVerification,
    getReviews
};
