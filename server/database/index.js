const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/foodloop.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

const initDB = () => {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    return new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) {
                console.error('Error executing schema:', err.message);
                reject(err);
            } else {
                console.log('Database schema initialized.');
                const migrations = [
                    ['restaurants', 'operational_status', "TEXT DEFAULT 'ACTIVE'"],
                    ['restaurants', 'block_reason', 'TEXT'],
                    ['restaurants', 'block_until', 'DATETIME'],
                    ['restaurants', 'trust_score', 'INTEGER DEFAULT 100'],
                    ['reviews', 'packaging_rating', 'INTEGER'],
                    ['reports', 'resolution_action', 'TEXT']
                ];
                let pending = migrations.length;
                migrations.forEach(([table, column, definition]) => db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, migrationError => {
                    if (migrationError && !migrationError.message.includes('duplicate column name')) return reject(migrationError);
                    pending -= 1;
                    if (!pending) resolve();
                }));
            }
        });
    });
};

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

module.exports = {
    db,
    initDB,
    query,
    get,
    run
};
