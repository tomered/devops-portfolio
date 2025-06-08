import requests
import sys
import time

MAX_RETRIES = 15
RETRY_INTERVAL = 5

def wait_for_service(url):
    print(f"Waiting for service at {url} to become available...")
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Service is up (attempt {attempt})")
                return response
            else:
                print(f"Attempt {attempt}: Received status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"Attempt {attempt}: Connection failed")
        time.sleep(RETRY_INTERVAL)

    print("Service did not become available in time.")
    sys.exit(1)

def main():
    url = "http://13.203.10.36:3000/api/readyz"
    response = wait_for_service(url)

    # The response should be plain text "READY"
    content = response.text.strip()
    if content != "READY":
        print(f"Unexpected response content: '{content}' (expected 'READY')")
        sys.exit(1)

    print("/readyz endpoint E2E test passed.")

if __name__ == "__main__":
    main()