const { classifyFood, estimateDemand, recommendAllocation } = require('../services/aiService');

const classify = async (req, res) => {
    try {
        const { food_name } = req.body;
        if (!food_name || typeof food_name !== 'string') return res.status(400).json({ error: 'Food name is required' });
        const result = await classifyFood(food_name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Classification failed' });
    }
};

const predictDemand = async (req, res) => {
    try {
        const { restaurant_name, food_name, day, time, available_quantity } = req.body;
        if (!Number.isFinite(available_quantity) || available_quantity < 0) return res.status(400).json({ error: 'Valid available quantity is required' });
        const result = await estimateDemand(restaurant_name, food_name, day, time, available_quantity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Demand estimation failed' });
    }
};

const recommendAlloc = async (req, res) => {
    try {
        const { available, customer_demand, community_demand, community_capacity } = req.body;
        if (![available, customer_demand, community_demand, community_capacity].every(value => Number.isFinite(value) && value >= 0)) return res.status(400).json({ error: 'Valid allocation quantities are required' });
        const result = await recommendAllocation(available, customer_demand, community_demand, community_capacity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Allocation recommendation failed' });
    }
};

module.exports = {
    classify,
    predictDemand,
    recommendAlloc
};
