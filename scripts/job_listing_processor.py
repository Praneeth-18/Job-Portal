import os
import time
import pandas as pd
import psycopg2
from datetime import datetime, timedelta
import logging
import schedule
from csvdownload import download_csv
import glob
from sqlalchemy import create_engine
import numpy as np
import hashlib
import json
from typing import Tuple, Dict, List

# Configure logging
logging.basicConfig(
    filename='job_listing_processor.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Database configuration
DB_NAME = "joblistingsportal"
DB_USER = os.getenv("DB_USER", "saipraneethkonuri")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# Directory configuration
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "joblistings")

def get_database_connection():
    """Create and return a database connection"""
    try:
        # Try multiple times to connect to the database
        max_retries = 3
        retry_count = 0
        last_error = None
        
        while retry_count < max_retries:
            try:
                conn = psycopg2.connect(
                    dbname=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD,
                    host=DB_HOST,
                    port=DB_PORT
                )
                logging.info("Successfully connected to the database")
                return conn
            except Exception as e:
                last_error = e
                retry_count += 1
                logging.warning(f"Database connection attempt {retry_count} failed: {str(e)}")
                time.sleep(2)  # Wait before retrying
        
        # If we get here, all retries failed
        logging.error(f"Database connection error after {max_retries} attempts: {str(last_error)}")
        raise last_error
    except Exception as e:
        logging.error(f"Database connection error: {str(e)}")
        raise

def get_latest_csv():
    """Get the most recently downloaded CSV file"""
    try:
        list_of_files = glob.glob(os.path.join(DOWNLOAD_DIR, '*.csv'))
        if not list_of_files:
            return None
        latest_file = max(list_of_files, key=os.path.getctime)
        return latest_file
    except Exception as e:
        logging.error(f"Error finding latest CSV: {str(e)}")
        return None

def calculate_content_hash(row: pd.Series) -> str:
    """Calculate a hash of the job listing content to detect changes"""
    # Create a dictionary of relevant fields for change detection
    content_dict = {
        'position_title': str(row.get('position_title', '')),
        'company': str(row.get('company', '')),
        'location': str(row.get('location', '')),
        'salary': str(row.get('salary', '')),
        'qualifications': str(row.get('qualifications', '')),
        'work_model': str(row.get('work_model', '')),
        'company_size': str(row.get('company_size', '')),
        'company_industry': str(row.get('company_industry', '')),
        'h1b_sponsored': str(row.get('h1b_sponsored', '')),
        'is_new_grad': str(row.get('is_new_grad', ''))
    }
    
    # Create a consistent string representation and hash it
    content_str = json.dumps(content_dict, sort_keys=True)
    return hashlib.sha256(content_str.encode()).hexdigest()

def mark_inactive_listings(conn, current_listings: List[Tuple[str, str, str]]) -> int:
    """Mark listings as inactive if they're not in the current dataset"""
    try:
        with conn.cursor() as cur:
            # Create a temporary table for the current listings
            cur.execute("""
                CREATE TEMP TABLE current_listings (
                    position_title VARCHAR(255),
                    company VARCHAR(255),
                    posting_date DATE
                ) ON COMMIT DROP
            """)
            
            # Insert current listings into temp table
            cur.executemany(
                "INSERT INTO current_listings VALUES (%s, %s, %s)",
                current_listings
            )
            
            # Update listings that are not in the current dataset
            cur.execute("""
                UPDATE job_listings
                SET is_active = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE is_active = TRUE
                AND (position_title, company, posting_date) NOT IN (
                    SELECT position_title, company, posting_date
                    FROM current_listings
                )
            """)
            
            return cur.rowcount
    except Exception as e:
        logging.error(f"Error marking inactive listings: {str(e)}")
        conn.rollback()
        raise

def process_csv_file(csv_file_path: str) -> bool:
    """Process the CSV file and update the database with changes"""
    conn = None
    try:
        # Read CSV file
        df = pd.read_csv(csv_file_path)
        
        # Clean and prepare the data
        column_mapping = {
            'Position Title': 'position_title',
            'Date': 'date',
            'Apply': 'apply',
            'Work Model': 'work_model',
            'Location': 'location',
            'Company': 'company',
            'Company Size': 'company_size',
            'Company Industry': 'company_industry',
            'Salary': 'salary',
            'Qualifications': 'qualifications',
            'H1b Sponsored': 'h1b_sponsored',
            'Is New Grad': 'is_new_grad'
        }
        df = df.rename(columns=column_mapping)
        
        # Convert date format
        df['posting_date'] = pd.to_datetime(df['date'])
        
        # Convert boolean columns - update logic as per requirements with case sensitivity
        # For h1b_sponsored: "yes" -> True, "not sure"/"no" -> False (case sensitive)
        df['h1b_sponsored'] = df['h1b_sponsored'].apply(lambda x: True if x == 'yes' else False)
        
        # For is_new_grad: "yes" -> True, Empty/Other -> False (case sensitive)
        df['is_new_grad'] = df['is_new_grad'].apply(lambda x: True if x == 'yes' else False)
        
        # Calculate content hash for each row
        df['content_hash'] = df.apply(calculate_content_hash, axis=1)
        
        # Replace NaN values with None
        df = df.replace({np.nan: None})
        
        conn = get_database_connection()
        
        # Keep track of statistics
        stats = {
            'processed': len(df),
            'updated': 0,
            'inserted': 0
        }
        
        # Create a list of current listings for inactive marking
        current_listings = list(zip(
            df['position_title'],
            df['company'],
            df['posting_date']
        ))
        
        # Mark old listings as inactive
        inactive_count = mark_inactive_listings(conn, current_listings)
        logging.info(f"Marked {inactive_count} listings as inactive")
        
        # Process each row
        for _, row in df.iterrows():
            try:
                with conn.cursor() as cur:
                    # Insert new listing without checking for duplicates
                    try:
                        cur.execute("""
                            INSERT INTO job_listings (
                                position_title, posting_date, apply_link,
                                work_model, location, company, company_size,
                                company_industry, salary, qualifications,
                                h1b_sponsored, is_new_grad, content_hash,
                                created_at, updated_at, last_seen_at, is_active
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)
                        """, (
                            row['position_title'], row['posting_date'], row['apply'],
                            row['work_model'], row['location'], row['company'],
                            row['company_size'], row['company_industry'], row['salary'],
                            row['qualifications'], row['h1b_sponsored'],
                            row['is_new_grad'], row['content_hash']
                        ))
                        stats['inserted'] += 1
                    except psycopg2.errors.UniqueViolation:
                        # If there's a unique constraint violation, just update the last_seen_at
                        conn.rollback()  # Need to rollback the failed transaction
                        cur.execute("""
                            UPDATE job_listings
                            SET last_seen_at = CURRENT_TIMESTAMP,
                                is_active = TRUE
                            WHERE position_title = %s
                            AND company = %s
                            AND posting_date = %s
                        """, (row['position_title'], row['company'], row['posting_date']))
                        stats['updated'] += 1
            
            except Exception as e:
                logging.error(f"Error processing row: {str(e)}")
                print(f"Error processing row: {str(e)}")  # Add direct console output
                conn.rollback()
                continue
        
        # Record processing in history table
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        INSERT INTO csv_processing_history (
                            filename, status, records_processed,
                            records_inserted, processed_at
                        ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    """, (
                        os.path.basename(csv_file_path),
                        'success',
                        stats['processed'],
                        stats['inserted']
                    ))
                except Exception as e:
                    logging.warning(f"Could not record processing history: {str(e)}")
                    # Don't rollback here - we still want to commit the main data
        except Exception as e:
            logging.warning(f"Could not record processing history: {str(e)}")
        
        # Explicitly commit the transaction to ensure data is saved
        conn.commit()
        logging.info(f"Processing complete - Processed: {stats['processed']}, Inserted: {stats['inserted']}")
        return True
    
    except Exception as e:
        logging.error(f"Error processing CSV file: {str(e)}")
        if conn:
            conn.rollback()
        return False
    
    finally:
        if conn:
            conn.close()

def verify_data_integrity():
    """Verify data integrity and log any issues"""
    try:
        with get_database_connection() as conn:
            with conn.cursor() as cur:
                # Check for duplicate listings
                cur.execute("""
                    SELECT position_title, company, posting_date, COUNT(*)
                    FROM job_listings
                    GROUP BY position_title, company, posting_date
                    HAVING COUNT(*) > 1
                """)
                duplicates = cur.fetchall()
                if duplicates:
                    logging.warning(f"Found {len(duplicates)} duplicate listings")
                
                # Check for listings with missing required fields
                cur.execute("""
                    SELECT id, position_title
                    FROM job_listings
                    WHERE position_title IS NULL
                    OR company IS NULL
                    OR posting_date IS NULL
                """)
                invalid = cur.fetchall()
                if invalid:
                    logging.warning(f"Found {len(invalid)} listings with missing required fields")
                
                # Check for stale listings
                cur.execute("""
                    SELECT COUNT(*)
                    FROM job_listings
                    WHERE is_active = TRUE
                    AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL '48 hours'
                """)
                stale_count = cur.fetchone()[0]
                if stale_count > 0:
                    logging.warning(f"Found {stale_count} potentially stale active listings")
                
                return not (duplicates or invalid or stale_count > 0)
    
    except Exception as e:
        logging.error(f"Error verifying data integrity: {str(e)}")
        return False

def job_collection_task():
    """Main task to be run hourly"""
    logging.info("Starting job collection task")
    try:
        # Download new CSV
        download_csv()
        
        # Get the latest CSV file
        latest_csv = get_latest_csv()
        if latest_csv:
            # Process the CSV file
            success = process_csv_file(latest_csv)
            if success:
                # Verify data integrity
                if verify_data_integrity():
                    logging.info("Job collection task completed successfully with verified integrity")
                else:
                    logging.warning("Job collection completed but data integrity issues were found")
            else:
                logging.error("Failed to process CSV file")
        else:
            logging.error("No CSV file found to process")
    
    except Exception as e:
        logging.error(f"Error in job collection task: {str(e)}")

def main():
    """Main function to schedule and run the job collection task"""
    logging.info("Starting job listing collection service")
    
    # Schedule the task to run every hour
    schedule.every().hour.do(job_collection_task)
    
    # Run the task immediately on startup
    job_collection_task()
    
    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Wait for 60 seconds before checking schedule again

if __name__ == "__main__":
    main() 