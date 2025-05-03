const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT COUNT(*) FROM job_listings')
  .then(res => {
    console.log('Connected to database');
    console.log('Total job listings:', res.rows[0].count);
    pool.end();
  })
  .catch(err => {
    console.error('Database error:', err);
    pool.end();
  }); 