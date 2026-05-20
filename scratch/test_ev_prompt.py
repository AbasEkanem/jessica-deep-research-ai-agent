import requests
import json
import time

url = 'http://localhost:8000/ask'
data = {
    'message': 'Write a 3-part competitive analysis on the EV market in Southeast Asia referencing regulatory changes in the last 6 months',
    'thread_id': 'debug_ev_analysis_001'
}

print('Sending EV research prompt...')
start = time.time()
token_count = 0
subagent_count = 0
error_events = []

try:
    response = requests.post(url, json=data, stream=True, timeout=300)
    for line in response.iter_lines():
        if line:
            decoded = line.decode('utf-8')
            if decoded.startswith('data: '):
                payload = decoded[6:]
                if payload == '[DONE]':
                    print('\n--- STREAM DONE ---')
                    break
                try:
                    event = json.loads(payload)
                    etype = event.get('type')
                    if etype == 'token':
                        token_count += 1
                        if token_count <= 5 or token_count % 50 == 0:
                            print(f'  Token #{token_count}: {event["data"][:60]}')
                    elif etype == 'subagent':
                        subagent_count += 1
                        print(f'  SUBAGENT: {event["data"]}')
                    elif etype == 'error':
                        error_events.append(event["data"])
                        print(f'  ERROR: {event["data"][:200]}')
                except:
                    pass
except Exception as e:
    print(f'Request failed after {time.time()-start:.1f}s: {e}')

elapsed = time.time() - start
print(f'\nCompleted in {elapsed:.1f}s')
print(f'  Tokens: {token_count}')
print(f'  Subagents: {subagent_count}')
print(f'  Errors: {error_events}')
if token_count == 0:
    print('\n  >>> CONFIRMED BUG: Zero tokens for complex research prompt!')
