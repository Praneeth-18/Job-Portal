import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, userId } = body;

    console.log(`Creating application for jobId: ${jobId}, userId: ${userId}`);

    // Check if required fields are present
    if (!jobId || !userId) {
      return NextResponse.json(
        { error: 'Job ID and User ID are required' },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First check if application already exists
      const existingApp = await client.query(
        `SELECT * FROM user_applications 
         WHERE job_listing_id = $1 AND user_id = $2`,
        [jobId, userId]
      );

      if (existingApp.rows.length > 0) {
        await client.query('ROLLBACK');
        console.log(`Application already exists: ${JSON.stringify(existingApp.rows[0])}`);
        return NextResponse.json(existingApp.rows[0]);
      }

      // Create a new application using direct SQL with all required fields
      const currentTime = new Date().toISOString();
      const result = await client.query(
        `INSERT INTO user_applications 
         (job_listing_id, user_id, current_status, applied_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [jobId, userId, 'Applied', currentTime, currentTime]
      );
      
      const newApplication = result.rows[0];
      
      // Add initial status history entry
      await client.query(
        `INSERT INTO application_status_history 
         (user_application_id, status, changed_at) 
         VALUES ($1, $2, $3)`,
        [newApplication.id, 'Applied', currentTime]
      );
      
      await client.query('COMMIT');

      console.log(`Application created: ${JSON.stringify(newApplication)}`);
      return NextResponse.json(newApplication);
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      
      // If it's a unique constraint violation, the application already exists
      if (dbError.code === '23505') { // PostgreSQL unique violation code
        return NextResponse.json(
          { message: 'You have already applied for this job' },
          { status: 200 }
        );
      }
      
      throw dbError; // Re-throw for the outer catch block
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating application:', error);
    
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, status } = body;

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the application status
      const updateResult = await client.query(
        `UPDATE user_applications 
         SET current_status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, applicationId]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      
      // Add entry to status history
      const currentTime = new Date().toISOString();
      await client.query(
        `INSERT INTO application_status_history 
         (user_application_id, status, changed_at) 
         VALUES ($1, $2, $3)`,
        [applicationId, status, currentTime]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all applications for the user with job listing details
    const result = await pool.query(
      `SELECT a.*, j.* 
       FROM user_applications a
       JOIN job_listings j ON a.job_listing_id = j.id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 