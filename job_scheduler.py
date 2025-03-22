from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import subprocess
import os
import signal
import sys
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
process = None

def run_job():
    global process
    try:
        # Kill any existing process
        if process is not None:
            try:
                os.kill(process.pid, signal.SIGTERM)
                logger.info(f"Terminated previous process with PID {process.pid}")
            except OSError:
                pass
        
        logger.info("Starting CSV download and processing job")
        
        # Run the job listing processor script from scripts directory
        script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'job_listing_processor.py')
        venv_python = os.path.join(os.path.dirname(__file__), 'job_processor_env', 'bin', 'python3')
        
        # Start the process using the virtual environment Python
        process = subprocess.Popen([venv_python, script_path], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE,
                                  text=True)
        
        logger.info(f"Started job_listing_processor.py with PID {process.pid}")
            
    except Exception as e:
        logger.error(f"An error occurred while running the job: {str(e)}")

def cleanup(signum, frame):
    global process
    if process is not None:
        try:
            os.kill(process.pid, signal.SIGTERM)
            logger.info(f"Terminated process with PID {process.pid} during shutdown")
        except OSError:
            pass
    logger.info("Scheduler stopped.")
    sys.exit(0)

def main():
    global process
    try:
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, cleanup)
        signal.signal(signal.SIGTERM, cleanup)
        
        scheduler = BlockingScheduler()
        
        # Schedule the job to run every hour
        scheduler.add_job(
            run_job,
            trigger=IntervalTrigger(hours=1),
            next_run_time=datetime.now()  # Run immediately when starting
        )
        
        logger.info("Scheduler started. Press Ctrl+C to exit.")
        scheduler.start()
        
    except (KeyboardInterrupt, SystemExit):
        cleanup(None, None)
    except Exception as e:
        logger.error(f"An error occurred in the scheduler: {str(e)}")
        if process is not None:
            try:
                os.kill(process.pid, signal.SIGTERM)
            except OSError:
                pass

if __name__ == "__main__":
    main() 