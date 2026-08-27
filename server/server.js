const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/auth');
const foodsRoutes = require('./routes/foods');
const ordersRoutes = require('./routes/orders');
const communityRoutes = require('./routes/community');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const customerRoutes = require('./routes/customer');
const restaurantRoutes = require('./routes/restaurant');
const reviewsRoutes = require('./routes/reviews');
const reportsRoutes = require('./routes/reports');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
const start = async () => {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`FoodLoop API server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

start();
