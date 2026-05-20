import requests
import json

url = 'http://localhost:8000/api/chat'
data = {
    'message': 'have your coding agent write a script to get the current price for solana and print the price for me',
    'thread_id': 'test_terminal_999'
}

print("Sending request to server...")
try:
    response = requests.post(url, json=data, stream=True, timeout=60)
    for line in response.iter_lines():
        if line:
            decoded = line.decode('utf-8')
            if decoded.startswith('data: '):
                payload = decoded[6:]
                if payload == '[DONE]':
                    break
                try:
                    event = json.loads(payload)
                    if event['type'] in ['tool', 'terminal', 'subagent']:
                        print(f"EVENT: {event['type']} -> {event['data']}")
                except Exception as e:
                    pass
except Exception as e:
    print(f"Request failed: {e}")
