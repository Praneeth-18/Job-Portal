from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import time
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def download_csv():
    # Set the download directory
    download_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "joblistings")  # Change this to your desired directory
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    # Configure ChromeOptions
    chrome_options = webdriver.ChromeOptions()
    prefs = {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    # Add additional options to make Chrome more stable
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-features=NetworkService")
    chrome_options.add_argument("--window-size=1920x1080")
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-extensions")

    # Set up Selenium with ChromeDriverManager to handle driver installation
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.get("https://www.newgrad-jobs.com/")

        try:
            # Wait for the page to load
            wait = WebDriverWait(driver, 30)  # Increased wait time

            # Wait for the Airtable iframe to load
            iframe = wait.until(
                EC.presence_of_element_located((By.ID, "airtable-box"))
            )
            
            # Hide the overlapping element if it exists
            try:
                driver.execute_script("document.querySelector('.flex-block-53').style.display = 'none';")
            except:
                pass

            # Scroll the iframe into the center of the viewport
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", iframe)

            # Switch to the iframe context
            driver.switch_to.frame(iframe)

            # Wait for the "Download CSV" button to be clickable
            download_button = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(@class, 'flex-inline') and contains(.//div, 'Download CSV')]"))
            )
            
            # Scroll the button into the center of the viewport
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", download_button)

            # Wait for the button to be visible
            wait.until(EC.visibility_of(download_button))

            # Click the button
            download_button.click()
            print("Download button clicked successfully!")

            # Wait for the file to download
            time.sleep(15)  # Increased wait time

            # Verify the downloaded file
            files = os.listdir(download_dir)
            csv_files = [f for f in files if f.endswith('.csv')]
            if csv_files:
                print(f"Downloaded file: {csv_files[0]}")
                print(f"File path: {os.path.join(download_dir, csv_files[0])}")
                return True
            else:
                print("No CSV files were downloaded.")
                return False

        except Exception as e:
            print(f"Could not find or click the download button: {e}")
            return False

    except Exception as e:
        print(f"Error initializing ChromeDriver: {e}")
        return False

    finally:
        if 'driver' in locals():
            # Switch back to the main page
            try:
                driver.switch_to.default_content()
            except:
                pass
            # Close the browser
            driver.quit()

if __name__ == "__main__":
    download_csv()