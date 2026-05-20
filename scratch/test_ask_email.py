import requests
import json
import sys

url = "http://localhost:8000/ask"
payload = {
    "message": "Use the email agent to check my latest emails. Do not send any emails.",
    "thread_id": "test_email_thread"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers, stream=True)
    if response.status_code != 200:
        print(f"Error: {response.status_code} {response.text}")
        sys.exit(1)
        
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            print(decoded_line)
except Exception as e:
    print(f"Exception: {e}")
