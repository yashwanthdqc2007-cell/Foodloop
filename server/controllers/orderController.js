const { run, get } = require('../database');

const createOrder = async (req, res) => {
    const { customer_id, food_batch_id, quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive whole number.' });
    }
    if (!Number.isInteger(customer_id) || customer_id <= 0 || !Number.isInteger(food_batch_id) || food_batch_id <= 0) {
        return res.status(400).json({ error: 'Valid customer and food batch IDs are required.' });
    }
    
    try {
        const customer = await get('SELECT id, role FROM users WHERE id = ?', [customer_id]);
        if (!customer || customer.role !== 'CUSTOMER') return res.status(403).json({ error: 'Only customers can place orders.' });

        const batch = await get(`SELECT f.*, r.operational_status FROM food_batches f JOIN restaurants r ON r.id = f.restaurant_id WHERE f.id = ?`, [food_batch_id]);
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        if (batch.operational_status !== 'ACTIVE') return res.status(403).json({ error: 'This restaurant is temporarily unavailable.' });
        
        // 1. Enforce time window validation
        if (batch.eligibility_status === 'BLOCKED' || new Date() > new Date(batch.handling_deadline)) {
            return res.status(400).json({ error: 'This food batch is no longer available or has expired.' });
        }
        
        // 2. Enforce inventory constraint
        if (batch.quantity < quantity) {
            return res.status(400).json({ error: 'Not enough quantity available.' });
        }
        
        const amount = batch.surplus_price * quantity;
        
        // Use a transaction conceptually (SQLite serializes these usually, but for a real app we'd use BEGIN/COMMIT)
        const orderRes = await run('INSERT INTO orders (customer_id, food_batch_id, quantity, amount, status) VALUES (?, ?, ?, ?, ?)', [
            customer_id, food_batch_id, quantity, amount, 'CONFIRMED'
        ]);
        
        await run('UPDATE food_batches SET quantity = quantity - ? WHERE id = ?', [quantity, food_batch_id]);
        
        res.status(201).json({ message: 'Order placed successfully', orderId: orderRes.lastID, amount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to place order' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

const updateOrderStatus = async (req, res) => {
    const { status, restaurant_id } = req.body;
    const transitions = { CONFIRMED: ['PREPARING', 'CANCELLED'], PREPARING: ['READY', 'CANCELLED'], READY: ['COMPLETED'], COMPLETED: [], CANCELLED: [] };
    if (!Object.prototype.hasOwnProperty.call(transitions, status)) return res.status(400).json({ error: 'Invalid order status.' });
    try {
        const order = await get('SELECT o.status, f.restaurant_id FROM orders o JOIN food_batches f ON f.id = o.food_batch_id WHERE o.id = ?', [req.params.id]);
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        if (order.restaurant_id !== restaurant_id) return res.status(403).json({ error: 'This order does not belong to the restaurant.' });
        if (!transitions[order.status].includes(status)) return res.status(400).json({ error: `Cannot move order from ${order.status} to ${status}.` });
        await run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Order status updated', status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order status.' });
    }
};

const getRestaurantOrders = async (req, res) => {
    const restaurantId = Number(req.query.restaurant_id);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) return res.status(400).json({ error: 'Valid restaurant ID is required.' });
    try {
        const orders = await require('../database').query(`SELECT o.id as order_id, o.quantity, o.amount, o.status, o.created_at, f.food_name, u.name as customer_name FROM orders o JOIN food_batches f ON f.id = o.food_batch_id JOIN users u ON u.id = o.customer_id WHERE f.restaurant_id = ? ORDER BY o.created_at DESC`, [restaurantId]);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant orders.' });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus
    ,getRestaurantOrders
};
