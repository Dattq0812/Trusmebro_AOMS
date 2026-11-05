const { Pool } = require('pg');
require('./config/env');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Bắt buộc cho Supabase
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  query_timeout: 10000,
});

pool.on('error', (error) => {
  console.error('Lỗi kết nối PostgreSQL:', error);
});

const truyVan = (sql, params) => pool.query(sql, params);

module.exports = { pool, truyVan };