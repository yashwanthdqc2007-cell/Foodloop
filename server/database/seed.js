const { db, initDB } = require('./index');
const crypto = require('crypto');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (error) { error ? reject(error) : resolve(this); }));
const hoursFromNow = hours => new Date(Date.now() + hours * 3600000).toISOString();
const hoursAgo = hours => new Date(Date.now() - hours * 3600000).toISOString();

const restaurantData = [
  ['Buhari Restaurant', 'buhari@foodloop.com', 'Biryani', '123 Mount Road, Chennai', 4.8, 96, 'ACTIVE'],
  ['Annapoorna Meals', 'annapoorna@foodloop.com', 'South Indian', '18 T Nagar, Chennai', 4.7, 94, 'ACTIVE'],
  ['Wok This Way', 'wok@foodloop.com', 'Chinese', '42 Velachery Main Road, Chennai', 4.4, 88, 'ACTIVE'],
  ['Madras Bakery', 'madrasbakery@foodloop.com', 'Bakery', '9 Adyar Bakery Street, Chennai', 4.6, 91, 'ACTIVE'],
  ['Green Leaf Kitchen', 'greenleaf@foodloop.com', 'Vegetarian', '77 Anna Nagar, Chennai', 4.5, 90, 'ACTIVE'],
  ['Marina Tiffin House', 'marina@foodloop.com', 'South Indian', '2 Marina Beach Road, Chennai', 4.3, 84, 'ACTIVE'],
  ['Spice Route', 'spiceroute@foodloop.com', 'Multi-cuisine', '11 Nungambakkam High Road, Chennai', 3.2, 65, 'UNDER_REVIEW'],
  ['Chaat Corner', 'chaat@foodloop.com', 'Fast Food', '33 Mylapore Tank Road, Chennai', 4.1, 78, 'ACTIVE'],
  ['Cloud Nine Cafe', 'cloudnine@foodloop.com', 'Multi-cuisine', '5 OMR Food Street, Chennai', 3.9, 73, 'ACTIVE'],
  ['The Dosa Lab', 'dosa@foodloop.com', 'Vegetarian', '61 Besant Nagar, Chennai', 4.2, 82, 'ACTIVE'],
  ['Royal Treats', 'royal@foodloop.com', 'Biryani', '88 Porur Junction, Chennai', 2.1, 35, 'TEMPORARILY_BLOCKED'],
  ['Little Italy Chennai', 'italy@foodloop.com', 'Multi-cuisine', '24 Alwarpet, Chennai', 4.0, 76, 'ACTIVE']
];
const foodNames = ['Chicken Biryani', 'Veg Meals', 'Sambar Rice', 'Lemon Rice', 'Parotta', 'Paneer Fried Rice', 'Idli', 'Dosa', 'Chilli Chicken', 'Veg Fried Rice', 'Chocolate Cake', 'Veg Puff'];
const menuNames = ['Chicken Biryani', 'Mutton Biryani', 'Chicken 65', 'Veg Meals', 'Parotta', 'Egg Fried Rice'];
const communities = ['Community Kitchen A', 'Chennai Food Bank', 'Hope Shelter', 'Little Stars Home', 'Annai NGO', 'Urban Relief Centre'];

async function seed() {
  for (const table of ['reports', 'reviews', 'matches', 'donation_requests', 'orders', 'food_batches', 'menu_items', 'community_partners', 'restaurants', 'users']) await run(`DROP TABLE IF EXISTS ${table}`);
  await initDB();
  const customer = await run('INSERT INTO users (name,email,password,role,location,phone,food_preference) VALUES (?,?,?,?,?,?,?)', ['John Doe', 'customer@foodloop.com', hash('password123'), 'CUSTOMER', 'Chennai', '9876543210', 'ALL']);
  await run('INSERT INTO users (name,email,password,role,location,phone,food_preference) VALUES (?,?,?,?,?,?,?)', ['Admin', 'admin@foodloop.com', hash('admin123'), 'ADMIN', 'System', '', 'ALL']);
  const restaurants = [];
  for (const [name, email, category, address, rating, trust, status] of restaurantData) {
    const user = await run('INSERT INTO users (name,email,password,role,location,phone,food_preference) VALUES (?,?,?,?,?,?,?)', [name, email, hash('password123'), 'RESTAURANT', 'Chennai', '9876500000', 'ALL']);
    const restaurant = await run('INSERT INTO restaurants (user_id,name,description,address,phone,email,fssai_number,verification_status,operational_status,trust_score,rating,total_reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [user.lastID, name, `${category} favourites made fresh in Chennai.`, address, '044-40000000', email, `FSSAI-${user.lastID}2938`, 'VERIFIED', status, trust, rating, status === 'ACTIVE' ? 12 : 8]);
    restaurants.push({ id: restaurant.lastID, status });
    for (let menuIndex = 0; menuIndex < menuNames.length; menuIndex += 1) {
      const menuName = menuNames[menuIndex];
      const foodType = menuName.startsWith('Veg') || menuName === 'Parotta' ? 'VEG' : 'NON_VEG';
      await run('INSERT INTO menu_items (restaurant_id,name,description,category,food_type,normal_price) VALUES (?,?,?,?,?,?)', [restaurant.lastID, menuName, 'Fresh daily special', category, foodType, 40 + menuIndex * 30]);
    }
  }
  const partners = [];
  for (let index = 0; index < communities.length; index += 1) {
    const email = index === 0 ? 'kitchena@foodloop.com' : `community${index + 1}@foodloop.com`;
    const user = await run('INSERT INTO users (name,email,password,role,location,phone,food_preference) VALUES (?,?,?,?,?,?,?)', [communities[index], email, hash('password123'), 'COMMUNITY', 'Chennai', `98765010${index}`, 'ALL']);
    const partner = await run('INSERT INTO community_partners (user_id,name,address,latitude,longitude,capacity,verification_status) VALUES (?,?,?,?,?,?,?)', [user.lastID, communities[index], `${10 + index} Service Road, Chennai`, 13.08 + index / 100, 80.27, 100 + index * 25, 'VERIFIED']);
    partners.push(partner.lastID);
    await run('INSERT INTO donation_requests (community_partner_id,category,food_type,quantity_required,required_by,pickup_available,status) VALUES (?,?,?,?,?,?,?)', [partner.lastID, 'Prepared Meal', index % 2 ? 'ALL' : 'VEG', 60 + index * 10, hoursFromNow(6), 1, 'OPEN']);
  }
  const batches = [];
  for (let index = 0; index < 36; index += 1) {
    const restaurant = restaurants[index % restaurants.length];
    const blocked = restaurant.status !== 'ACTIVE';
    const quantity = index % 9 === 0 ? 0 : 12 + (index % 5) * 4;
    const deadline = blocked || index % 8 === 0 ? hoursAgo(1) : hoursFromNow(index % 6 === 0 ? 0.4 : 3);
    const status = blocked ? 'BLOCKED' : quantity === 0 ? 'SOLD_OUT' : 'ACTIVE';
    const result = await run('INSERT INTO food_batches (batch_code,restaurant_id,food_name,category,quantity,original_price,surplus_price,prepared_at,storage_method,temperature,veg_type,handling_deadline,eligibility_status,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [`FL-DEMO-${index + 1}`, restaurant.id, foodNames[index % foodNames.length], 'Prepared Meal', quantity, 180, 72, hoursAgo(1), 'HOT_HELD', 65, index % 3 === 0 ? 'VEG' : 'NON_VEG', deadline, status === 'BLOCKED' ? 'BLOCKED' : index % 6 === 0 ? 'URGENT' : 'ELIGIBLE', status]);
    batches.push({ id: result.lastID, restaurantId: restaurant.id });
  }
  const customers = [customer];
  for (let index = 0; index < 11; index += 1) {
    const user = await run('INSERT INTO users (name,email,password,role,location,phone,food_preference) VALUES (?,?,?,?,?,?,?)', [`Demo Customer ${index + 2}`, `customer${index + 2}@foodloop.com`, hash('password123'), 'CUSTOMER', 'Chennai', `90000000${index + 20}`, index % 2 ? 'VEG' : 'ALL']);
    customers.push(user);
  }
  const completed = await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customer.lastID, batches[0].id, 2, 144, 'COMPLETED']);
  await run('UPDATE food_batches SET quantity = quantity - 2 WHERE id = ?', [batches[0].id]);
  const delivered = await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customer.lastID, batches[1].id, 1, 72, 'COMPLETED']);
  await run('UPDATE food_batches SET quantity = quantity - 1 WHERE id = ?', [batches[1].id]);
  const awaitingReview = await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customer.lastID, batches[2].id, 1, 72, 'COMPLETED']);
  await run('UPDATE food_batches SET quantity = quantity - 1 WHERE id = ?', [batches[2].id]);
  await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customer.lastID, batches[3].id, 1, 72, 'PREPARING']);
  await run('UPDATE food_batches SET quantity = quantity - 1 WHERE id = ?', [batches[3].id]);
  await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customer.lastID, batches[4].id, 1, 72, 'READY']);
  await run('UPDATE food_batches SET quantity = quantity - 1 WHERE id = ?', [batches[4].id]);
  await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customer.lastID, batches[5].id, 1, 72, 'CANCELLED']);
  const extraStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'READY', 'PREPARING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'COMPLETED', 'READY', 'COMPLETED'];
  const extraOrders = [];
  for (let index = 0; index < extraStatuses.length; index += 1) {
    const order = await run('INSERT INTO orders (customer_id,food_batch_id,quantity,amount,status) VALUES (?,?,?,?,?)', [customers[index].lastID, batches[index + 6].id, 1, 72, extraStatuses[index]]);
    if (extraStatuses[index] !== 'CANCELLED') await run('UPDATE food_batches SET quantity = quantity - 1 WHERE id = ?', [batches[index + 6].id]);
    extraOrders.push({ id: order.lastID, batch: batches[index + 6] });
  }
  await run('INSERT INTO reviews (customer_id,restaurant_id,order_id,rating,food_quality_rating,packaging_rating,review_text) VALUES (?,?,?,?,?,?,?)', [customer.lastID, batches[0].restaurantId, completed.lastID, 5, 5, 5, 'Fresh and well packed.']);
  await run('INSERT INTO reviews (customer_id,restaurant_id,order_id,rating,food_quality_rating,packaging_rating,review_text) VALUES (?,?,?,?,?,?,?)', [customer.lastID, batches[1].restaurantId, delivered.lastID, 4, 4, 4, 'Tasty and filling.']);
  for (let index = 0; index < extraOrders.length; index += 1) {
    const order = extraOrders[index];
    if (['COMPLETED'].includes(extraStatuses[index])) {
      await run('INSERT INTO reviews (customer_id,restaurant_id,order_id,rating,food_quality_rating,packaging_rating,review_text) VALUES (?,?,?,?,?,?,?)', [customers[index].lastID, order.batch.restaurantId, order.id, (index % 5) + 1, (index % 5) + 1, ((index + 1) % 5) + 1, ['Excellent value.', 'Fresh and satisfying.', 'Could be better.', 'Needs attention.', 'Lovely meal.'][index % 5]]);
    }
  }
  const reportRows = [[restaurants[10].id, 'HYGIENE', 'Unsafe handling concern.', 'OPEN'], [restaurants[6].id, 'QUALITY', 'Incorrect food information.', 'UNDER_REVIEW'], [restaurants[0].id, 'PACKAGING', 'Packaging complaint resolved.', 'RESOLVED'], [restaurants[1].id, 'HYGIENE', 'Hygiene concern reported.', 'OPEN'], [restaurants[10].id, 'UNSAFE_HANDLING', 'Repeated unsafe handling concern.', 'RESOLVED']];
  for (const [restaurantId, category, description, status] of reportRows) await run('INSERT INTO reports (customer_id,restaurant_id,category,description,status) VALUES (?,?,?,?,?)', [customer.lastID, restaurantId, category, description, status]);
  await run("UPDATE restaurants SET verification_status = 'PENDING' WHERE id = ?", [restaurants[10].id]);
  await run("UPDATE restaurants SET verification_status = 'PENDING' WHERE id = ?", [restaurants[6].id]);
  await run("UPDATE restaurants SET verification_status = 'UNVERIFIED' WHERE id = ?", [restaurants[11].id]);
  await run("UPDATE restaurants SET total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviews.restaurant_id = restaurants.id), rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE reviews.restaurant_id = restaurants.id), rating) WHERE id IN (SELECT restaurant_id FROM reviews)");
  console.log(`Seeded ${restaurants.length} restaurants, ${batches.length} food listings, ${partners.length} community partners, ${customers.length} customers, and ${6 + extraOrders.length} orders.`);
}

seed().catch(error => console.error('Error during seeding:', error)).finally(() => db.close());
