const { query, get, run } = require('../database');
const { evaluateEligibility } = require('../services/safetyEngine');
const { classifyFood, estimateDemand } = require('../services/aiService');
const { allocateBatch } = require('../services/allocationEngine');
const crypto = require('crypto');

// Get all active eligible food batches for the marketplace
const getMarketplaceFoods = async (req, res) => {
    try {
        const sql = `
            SELECT fb.*, r.name as restaurant_name, r.address, r.latitude, r.longitude
            FROM food_batches fb
            JOIN restaurants r ON fb.restaurant_id = r.id
            WHERE fb.status = 'ACTIVE' AND fb.quantity > 0 AND fb.eligibility_status != 'BLOCKED'
            AND r.operational_status = 'ACTIVE'
            AND datetime('now', 'localtime') < fb.handling_deadline
        `;
        const foods = await query(sql);
        res.json(foods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getFoodById = async (req, res) => {
    try {
        const sql = `
            SELECT fb.*, r.name as restaurant_name, r.address 
            FROM food_batches fb
            JOIN restaurants r ON fb.restaurant_id = r.id
            WHERE fb.id = ?
        `;
        const food = await get(sql, [req.params.id]);
        if (!food) return res.status(404).json({ error: 'Not found' });
        res.json(food);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const createFoodBatch = async (req, res) => {
    const { restaurant_id, menu_item_id, food_name, quantity, original_price, surplus_price, prepared_at, storage_method, temperature } = req.body;
    if (!Number.isInteger(restaurant_id) || restaurant_id <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Valid restaurant ID and positive quantity are required.' });
    }
    if (!Number.isFinite(original_price) || original_price <= 0 || !Number.isFinite(surplus_price) || surplus_price < 0) {
        return res.status(400).json({ error: 'Valid prices are required.' });
    }
    if (!food_name || !prepared_at || !storage_method || !Number.isFinite(Number(temperature))) {
        return res.status(400).json({ error: 'Food, preparation, storage, and temperature details are required.' });
    }
    try {
        const restaurant = await get('SELECT verification_status FROM restaurants WHERE id = ?', [restaurant_id]);
        if (!restaurant || restaurant.verification_status !== 'VERIFIED') {
            return res.status(403).json({ error: 'Restaurant must be verified by an admin to create food batches.' });
        }
        const restaurantState = await get('SELECT operational_status FROM restaurants WHERE id = ?', [restaurant_id]);
        if (restaurantState.operational_status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Your restaurant is temporarily unavailable while an issue is under review.' });
        }

        if (surplus_price > original_price * 0.5) {
            return res.status(400).json({ error: 'Surplus price must be at least 50% off the original price.' });
        }
        let finalFoodName = food_name;
        let finalCategory = '';
        let finalVegType = '';
        let classification = null;

        if (menu_item_id) {
            const menuItem = await get('SELECT name, category, food_type FROM menu_items WHERE id = ?', [menu_item_id]);
            if (menuItem) {
                finalFoodName = menuItem.name;
                finalCategory = menuItem.category;
                finalVegType = menuItem.food_type;
            }
        } 
        
        if (!menu_item_id || !finalCategory) {
            // Fallback to AI Classification if manual entry or menu item not found/incomplete
            classification = await classifyFood(finalFoodName);
            finalCategory = classification.category;
            finalVegType = classification.type;
        }
        
        // 2. Safety Eligibility
        const eligibility = evaluateEligibility({
            preparedAt: prepared_at,
            storageMethod: storage_method,
            temperature: parseFloat(temperature),
            category: finalCategory
        });
        
        const batchCode = 'FL-' + new Date().getFullYear() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const sql = `
            INSERT INTO food_batches 
            (batch_code, restaurant_id, menu_item_id, food_name, category, quantity, original_price, surplus_price, prepared_at, storage_method, temperature, veg_type, handling_deadline, eligibility_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [
            batchCode, restaurant_id, menu_item_id || null, finalFoodName, finalCategory, quantity, original_price, surplus_price, prepared_at, storage_method, temperature, finalVegType, eligibility.handlingDeadline, eligibility.status
        ]);
        
        const newBatchId = result.lastID;
        
        res.status(201).json({ 
            message: 'Batch created successfully', 
            batchId: newBatchId, 
            classification,
            eligibility
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create food batch' });
    }
};

const allocateFoodBatch = async (req, res) => {
    const batchId = req.params.id;
    try {
        const batch = await get('SELECT * FROM food_batches WHERE id = ?', [batchId]);
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        if (batch.eligibility_status === 'BLOCKED') {
            return res.status(400).json({ error: 'Cannot allocate blocked batch.' });
        }
        
        const rName = (await get('SELECT name FROM restaurants WHERE id = ?', [batch.restaurant_id])).name;
        
        // 1. Estimate Demand
        const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const time = new Date().toLocaleTimeString('en-US');
        const demandEst = await estimateDemand(rName, batch.food_name, day, time, batch.quantity);
        
        // 2. Fetch community capacity (mock query summing up all open requirements for this category)
        const reqs = await query('SELECT sum(quantity_required) as totalReq FROM donation_requests WHERE status = "OPEN"');
        const communityCapacity = reqs[0].totalReq || 0;
        
        // 3. Run allocation engine
        const allocation = await allocateBatch(
            batch.quantity, 
            demandEst.expectedCustomerDemand, 
            demandEst.expectedCommunityDemand, 
            communityCapacity
        );
        
        res.json({
            demandEstimation: demandEst,
            allocation: allocation
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Allocation failed' });
    }
};

module.exports = {
    getMarketplaceFoods,
    getFoodById,
    createFoodBatch,
    allocateFoodBatch
};
