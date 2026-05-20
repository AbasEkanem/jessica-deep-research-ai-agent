import requests, sys, json
url = 'http://127.0.0.1:8000/ask'
payload = {"message": "Hello, Jessica!", "thread_id": "test"}
with requests.post(url, json=payload, stream=True) as r:
    for line in r.iter_lines():
        if line:
            sys.stdout.buffer.write(line + b'\n')
            sys.stdout.flush()
