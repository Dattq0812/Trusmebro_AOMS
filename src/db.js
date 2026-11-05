const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Bắt buộc cho Supabase
  max: 5,
});

const truyVan = (sql, params) => pool.query(sql, params);

module.exports = { pool, truyVan };