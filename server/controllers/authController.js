const { get } = require('../database');
const crypto = require('crypto');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        const user = await get('SELECT id, name, email, role, location, food_preference FROM users WHERE email = ? AND password = ?', [email, hash]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Return extra info depending on role for MVP dashboard ease
        if (user.role === 'RESTAURANT') {
            const r = await get('SELECT id FROM restaurants WHERE user_id = ?', [user.id]);
            if (r) user.restaurant_id = r.id;
        } else if (user.role === 'COMMUNITY') {
            const c = await get('SELECT id FROM community_partners WHERE user_id = ?', [user.id]);
            if (c) user.community_partner_id = c.id;
        }
        
        // We can just return the user object (no real JWT needed for hackathon MVP)
        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const getMe = async (req, res) => {
    res.json({ error: 'Not implemented' });
};

const register = async (req, res) => {
    const { name, email, phone, password, location, food_preference } = req.body;
    
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Name, email, phone, and password are required' });
    }

    try {
        const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hash = crypto.createHash('sha256').update(password).digest('hex');
        const { run } = require('../database');
        const result = await run(
            'INSERT INTO users (name, email, phone, password, location, food_preference, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone, hash, location, food_preference || 'ALL', 'CUSTOMER']
        );
        
        const user = {
            id: result.lastID,
            name,
            email,
            phone,
            role: 'CUSTOMER',
            location,
            food_preference: food_preference || 'ALL'
        };

        res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

module.exports = {
    login,
    getMe,
    register
};
