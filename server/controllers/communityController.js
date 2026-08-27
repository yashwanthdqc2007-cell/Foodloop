const { query, run, get } = require('../database');

const getRequirements = async (req, res) => {
    try {
        const sql = `
            SELECT dr.*, cp.name as community_name, cp.latitude as community_latitude, cp.longitude as community_longitude
            FROM donation_requests dr
            JOIN community_partners cp ON dr.community_partner_id = cp.id
            WHERE dr.status IN ('OPEN', 'ACTIVE', 'PARTIALLY_FILLED')
        `;
        const reqs = await query(sql);
        res.json(reqs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch requirements' });
    }
};

const createRequirement = async (req, res) => {
    const { community_partner_id, category, food_type, quantity_required, required_by, pickup_available, notes } = req.body;
    if (!Number.isInteger(community_partner_id) || community_partner_id <= 0 || !category || !Number.isInteger(quantity_required) || quantity_required <= 0 || !required_by) {
        return res.status(400).json({ error: 'Valid partner, category, quantity, and required-by date are required.' });
    }
    try {
        const sql = `
            INSERT INTO donation_requests 
            (community_partner_id, category, food_type, quantity_required, required_by, pickup_available, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `;
        const result = await run(sql, [community_partner_id, category, food_type, quantity_required, required_by, pickup_available, notes]);
        res.status(201).json({ message: 'Requirement posted', id: result.lastID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create requirement' });
    }
};

const updateRequirement = async (req, res) => {
    const { status } = req.body; // e.g. CANCELLED, CLOSED
    try {
        await run("UPDATE donation_requests SET status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ message: 'Requirement updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update requirement' });
    }
};

const claimDonation = async (req, res) => {
    const batchId = req.params.id;
    const { community_partner_id, quantity, requirement_id } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive whole number.' });
    }
    if (!Number.isInteger(community_partner_id) || community_partner_id <= 0) {
        return res.status(400).json({ error: 'Valid community partner ID is required.' });
    }
    
    try {
        const partner = await get('SELECT id FROM community_partners WHERE id = ?', [community_partner_id]);
        if (!partner) return res.status(403).json({ error: 'Invalid community partner.' });

        const batch = await get(`SELECT f.*, r.operational_status FROM food_batches f JOIN restaurants r ON r.id = f.restaurant_id WHERE f.id = ?`, [batchId]);
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        if (batch.operational_status !== 'ACTIVE') return res.status(403).json({ error: 'This restaurant is temporarily unavailable.' });
        
        if (batch.eligibility_status === 'BLOCKED' || new Date() > new Date(batch.handling_deadline)) {
            return res.status(400).json({ error: 'This food batch is no longer available.' });
        }
        
        if (batch.quantity < quantity) {
            return res.status(400).json({ error: 'Not enough quantity available.' });
        }
        
        // Record the match (claim)
        const matchSql = `INSERT INTO matches (food_batch_id, recipient_id, quantity, status) VALUES (?, ?, ?, 'CLAIMED')`;
        await run(matchSql, [batchId, community_partner_id, quantity]);
        
        // Deduct inventory
        await run('UPDATE food_batches SET quantity = quantity - ? WHERE id = ?', [quantity, batchId]);
        
        // Update requirement if passed
        if (requirement_id) {
            const req = await get('SELECT quantity_required, quantity_received FROM donation_requests WHERE id = ?', [requirement_id]);
            if (req) {
                const newReceived = req.quantity_received + quantity;
                let status = 'PARTIALLY_FILLED';
                if (newReceived >= req.quantity_required) status = 'FULFILLED';
                
                await run('UPDATE donation_requests SET quantity_received = ?, status = ? WHERE id = ?', [newReceived, status, requirement_id]);
            }
        }

        res.json({ message: 'Donation claimed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to claim donation' });
    }
};

module.exports = {
    getRequirements,
    createRequirement,
    updateRequirement,
    claimDonation
};
