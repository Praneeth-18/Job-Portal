import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://saipraneethkonuri@localhost:5432/joblistingsportal?schema=public'
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