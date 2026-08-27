-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('CUSTOMER', 'RESTAURANT', 'COMMUNITY', 'ADMIN')) NOT NULL,
    location TEXT,
    phone TEXT,
    food_preference TEXT DEFAULT 'ALL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    fssai_number TEXT,
    latitude REAL,
    longitude REAL,
    verification_status TEXT DEFAULT 'PENDING',
    operational_status TEXT DEFAULT 'ACTIVE' CHECK(operational_status IN ('ACTIVE', 'UNDER_REVIEW', 'TEMPORARILY_BLOCKED', 'SUSPENDED')),
    block_reason TEXT,
    block_until DATETIME,
    trust_score INTEGER DEFAULT 100,
    rating REAL DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    food_type TEXT CHECK(food_type IN ('VEG', 'NON_VEG')) NOT NULL,
    normal_price REAL NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(restaurant_id) REFERENCES restaurants(id)
);

-- Community Partners
CREATE TABLE IF NOT EXISTS community_partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    capacity INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'PENDING',
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Food Batches
CREATE TABLE IF NOT EXISTS food_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_code TEXT UNIQUE NOT NULL,
    restaurant_id INTEGER NOT NULL,
    menu_item_id INTEGER,
    food_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    original_price REAL NOT NULL,
    surplus_price REAL NOT NULL,
    prepared_at DATETIME NOT NULL,
    storage_method TEXT NOT NULL,
    temperature REAL,
    veg_type TEXT NOT NULL,
    handling_deadline DATETIME NOT NULL,
    eligibility_status TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    food_batch_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    fulfillment_type TEXT DEFAULT 'PICKUP',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(food_batch_id) REFERENCES food_batches(id)
);

-- Donation Requests (Requirements)
CREATE TABLE IF NOT EXISTS donation_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_partner_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    food_type TEXT,
    quantity_required INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    required_by DATETIME NOT NULL,
    pickup_available BOOLEAN DEFAULT 1,
    notes TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(community_partner_id) REFERENCES community_partners(id)
);

-- Matches (Allocations to Community)
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_batch_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    recipient_type TEXT DEFAULT 'COMMUNITY',
    quantity INTEGER NOT NULL,
    match_score REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(food_batch_id) REFERENCES food_batches(id),
    FOREIGN KEY(recipient_id) REFERENCES community_partners(id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL UNIQUE,
    rating INTEGER NOT NULL,
    food_quality_rating INTEGER,
    value_rating INTEGER,
    pickup_rating INTEGER,
    packaging_rating INTEGER,
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER,
    order_id INTEGER,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolution_action TEXT,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
);
