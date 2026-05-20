filepath = r'c:\Users\Bussiness Sensor\Desktop\jessica_project\fastAPI.py'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the on_chat_model_start block start line
start_idx = None
for i, line in enumerate(lines):
    if 'event_type == "on_chat_model_start"' in line:
        start_idx = i
        break

if start_idx is None:
    print("ERROR: Could not find on_chat_model_start")
    exit(1)

print(f"Found at line {start_idx + 1}")
# Print surrounding lines for verification
for j in range(start_idx - 1, start_idx + 8):
    print(f"  {j+1}: {repr(lines[j])}")

# The block runs from start_idx to start_idx+5 (5 lines including the blank line after)
# Replace with the corrected on_chain_start block
new_block = [
    '                elif event_type == "on_chain_start":\n',
    '                    # deepagents fires on_chain_start when delegating to a subagent.\n',
    '                    # The event `name` field is the subagent registered name.\n',
    '                    _subagent_display = {\n',
    '                        "coding_agent": "Coding Agent",\n',
    '                        "websearcher":  "Web Searcher",\n',
    '                        "email_agent":  "Email Agent",\n',
    '                    }\n',
    '                    if name in _subagent_display:\n',
    '                        friendly = _subagent_display[name]\n',
    '                        await queue.put(f"data: {json.dumps({\'type\': \'subagent\', \'data\': f\'{friendly} is working...\'})}" + "\\n\\n")\n',
    '\n',
]

# Detect how many lines the old block occupies (until the next elif/else/blank that exits the block)
end_idx = start_idx + 1
while end_idx < len(lines):
    stripped = lines[end_idx].strip()
    if stripped.startswith('elif event_type') or stripped.startswith('await queue.put("data: [DONE]'):
        break
    end_idx += 1

print(f"\nReplacing lines {start_idx+1} to {end_idx} with new block...")
lines[start_idx:end_idx] = new_block

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESS: fastAPI.py patched.")

# Verify
with open(filepath, 'r', encoding='utf-8') as f:
    verify = f.readlines()
for j in range(start_idx - 1, start_idx + len(new_block) + 1):
    print(f"  {j+1}: {verify[j]}", end='')
