import requests
import json

url = 'http://localhost:8000/ask'
data = {
    'message': 'What is the capital of France? Search the web for it.',
    'thread_id': 'debug_stream_001'
}

print('Sending request to /ask...')
token_count = 0
tool_count = 0
subagent_count = 0
other_events = []

try:
    response = requests.post(url, json=data, stream=True, timeout=120)
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
                    elif etype == 'tool':
                        tool_count += 1
                        print(f'  TOOL: {event["data"]}')
                    elif etype == 'subagent':
                        subagent_count += 1
                        print(f'  SUBAGENT: {event["data"]}')
                    else:
                        other_events.append(etype)
                except:
                    pass
except Exception as e:
    print(f'Request failed: {e}')

print(f'\nSummary:')
print(f'  Tokens received: {token_count}')
print(f'  Tool events: {tool_count}')
print(f'  Subagent events: {subagent_count}')
print(f'  Other events: {other_events}')
if token_count == 0:
    print('\n  >>> PROBLEM: Zero tokens streamed! The subgraph filter is dropping them.')
