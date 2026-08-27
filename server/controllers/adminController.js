const { query } = require('../database');

const getAnalytics = async (req, res) => {
    try {
        const stats = {
            totalMealsProcessed: 0,
            mealsSold: 0,
            mealsDonated: 0,
            mealsBlocked: 0,
            revenueRecovered: 0,
            mealsRedirected: 0
        };

        // Orders metrics
        const orders = await query("SELECT sum(quantity) as qty, sum(amount) as rev FROM orders WHERE status = 'CONFIRMED'");
        stats.mealsSold = orders[0].qty || 0;
        stats.revenueRecovered = orders[0].rev || 0;

        // Donations metrics
        const matches = await query("SELECT sum(quantity) as qty FROM matches WHERE status = 'CLAIMED'");
        stats.mealsDonated = matches[0].qty || 0;
        
        // Blocked batches (we need original quantity for this, assume original_quantity = quantity initially for mvp, or we just sum remaining quantity of blocked batches)
        const blocked = await query("SELECT COALESCE(sum(quantity), 0) as qty FROM food_batches WHERE eligibility_status = 'BLOCKED' OR datetime('now') > datetime(handling_deadline)");
        stats.mealsBlocked = blocked[0].qty || 0;
        
        stats.mealsRedirected = stats.mealsSold + stats.mealsDonated;
        stats.totalMealsProcessed = stats.mealsRedirected + stats.mealsBlocked;

        const usersCount = await query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        stats.users = usersCount;

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

const getVerifications = async (req, res) => {
    try {
        const reqs = await query("SELECT id, name, address, fssai_number, verification_status, created_at FROM restaurants WHERE verification_status = 'PENDING'");
        res.json(reqs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch verifications' });
    }
};

const updateVerification = async (req, res) => {
    const { status } = req.body; // VERIFIED or REJECTED
    try {
        const { run } = require('../database');
        await run("UPDATE restaurants SET verification_status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ message: 'Verification updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update verification' });
    }
};

const getReports = async (req, res) => {
    try {
        const reports = await query(`
            SELECT r.*, u.name as customer_name, rest.name as restaurant_name 
            FROM reports r 
            LEFT JOIN users u ON r.customer_id = u.id 
            LEFT JOIN restaurants rest ON r.restaurant_id = rest.id 
            ORDER BY r.created_at DESC
        `);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

const updateReport = async (req, res) => {
    const { status, resolution_action } = req.body;
    try {
        const { run } = require('../database');
        await run("UPDATE reports SET status = ?, resolution_action = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?", [status, resolution_action || null, req.params.id]);
        res.json({ message: 'Report updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update report' });
    }
};

const getCustomers = async (req, res) => {
    try {
        const customers = await query(`
            SELECT u.id, u.name, u.email, u.phone, u.location, u.created_at,
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.customer_id
            WHERE u.role = 'CUSTOMER'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await query(`SELECT rv.*, r.name as restaurant_name, f.food_name, u.name as customer_name
            FROM reviews rv JOIN restaurants r ON r.id = rv.restaurant_id JOIN orders o ON o.id = rv.order_id
            JOIN food_batches f ON f.id = o.food_batch_id JOIN users u ON u.id = rv.customer_id ORDER BY rv.created_at DESC`);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

const getRestaurants = async (req, res) => {
    try {
        res.json(await query('SELECT id, name, rating, total_reviews, trust_score, operational_status, block_reason, block_until FROM restaurants ORDER BY name'));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
};

const updateRestaurantStatus = async (req, res) => {
    const { status, reason, duration } = req.body;
    const valid = ['ACTIVE', 'UNDER_REVIEW', 'TEMPORARILY_BLOCKED', 'SUSPENDED'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid restaurant status' });
    try {
        const until = status === 'TEMPORARILY_BLOCKED' && duration ? new Date(Date.now() + Number(duration) * 86400000).toISOString() : null;
        const { run } = require('../database');
        await run('UPDATE restaurants SET operational_status = ?, block_reason = ?, block_until = ? WHERE id = ?', [status, reason || null, until, req.params.id]);
        if (status !== 'ACTIVE') await run("UPDATE food_batches SET status = 'BLOCKED' WHERE restaurant_id = ? AND status = 'ACTIVE'", [req.params.id]);
        if (status === 'ACTIVE') await run("UPDATE food_batches SET status = 'ACTIVE' WHERE restaurant_id = ? AND status = 'BLOCKED' AND eligibility_status != 'BLOCKED' AND quantity > 0 AND handling_deadline > datetime('now')", [req.params.id]);
        res.json({ message: 'Restaurant status updated', status, block_until: until });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update restaurant status' });
    }
};

module.exports = {
    getAnalytics,
    getVerifications,
    updateVerification,
    getReports,
    updateReport,
    getCustomers
    ,getReviews
    ,updateRestaurantStatus
    ,getRestaurants
};
