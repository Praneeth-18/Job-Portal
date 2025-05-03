# Job Portal

A comprehensive job listing portal that aggregates job postings from various sources, with a focus on new graduate positions and H1B sponsorship opportunities.

## System Components

1. **Web Application (Next.js Frontend)**
   - Job listing display
   - Category filtering
   - H1B sponsorship filter
   - Application tracking

2. **Job Data Collection System**
   - Automated job scraping
   - Data processing and categorization
   - Database management

## Prerequisites

- Node.js (v18 or higher)
- Python 3.11 or higher
- PostgreSQL database
- Chrome/Chromium (for Selenium web scraping)

## Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
psql postgres
CREATE DATABASE joblistingsportal;
\c joblistingsportal

# Run the database schema creation script
psql -d joblistingsportal -f create_tables.sql
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Python Environment Setup

```bash
# Create and activate Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

## Running the Application

The application consists of multiple components that need to run simultaneously. Open separate terminal windows for each component:

### 1. Start the Web Application

```bash
# Terminal 1: Start the Next.js development server
npm run dev
```

The web application will be available at http://localhost:3000

### 2. Run the Job Scraper

```bash
# Terminal 2: Activate Python environment and run the job scheduler
source venv/bin/activate
python scripts/job_scheduler.py
```

### 3. Update Job Links (Optional)

```bash
# Terminal 3: Update actual job links
source venv/bin/activate
./fetch_actual_links.sh
```

## Development Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the production application
- `npm run start`: Start the production server
- `python scripts/job_scheduler.py`: Run the job scraping scheduler
- `./fetch_actual_links.sh`: Update job posting links

## Project Structure

```
job-portal/
├── src/                  # Frontend source code
├── scripts/             # Python scripts for job scraping
│   ├── job_scheduler.py
│   ├── csvdownload.py
│   └── job_listing_processor.py
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── data/               # Temporary data storage
```

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/joblistingsportal?schema=public"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## Troubleshooting

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database schema is properly initialized

2. **Job Scraper Issues**
   - Verify Chrome/Chromium is installed
   - Check Python virtual environment is activated
   - Ensure all required Python packages are installed

3. **Web Application Issues**
   - Clear `.next` cache: `rm -rf .next`
   - Rebuild node modules: `rm -rf node_modules && npm install`
   - Verify environment variables are set correctly

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
