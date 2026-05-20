import requests
import json
import sys

url = "http://localhost:8000/ask"
payload = {
    "message": "Use the coding agent to write a python script that calculates the 15th Fibonacci number and run it. Show me the output.",
    "thread_id": "test_coding_thread"
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
