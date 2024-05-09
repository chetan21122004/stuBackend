

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'prachi',
    host: 'localhost',
    port: 5432,
    database: 'attendance_db'
});
module.exports = pool;