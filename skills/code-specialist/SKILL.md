---
name: code-specialist
description: Use this skill when the user asks Jessica to write, execute, debug, review, or explain code. Triggers on requests like "write a script", "run this code", "fix this bug", "automate this task", "process this data programmatically", or "generate a Python script". Delegates all coding work to the coding_agent subagent.
license: MIT
compatibility: Requires coding_agent subagent to be loaded. Tools needed — execute_python, execute_shell, read_file, write_file, list_directory, code_reflection_tool.
metadata:
  author: Ekanem, Abasi-ikpongke (Emryz)
  version: "1.0"
allowed-tools: execute_python, execute_shell, read_file, write_file, list_directory, code_reflection_tool
---

# code-specialist

## Overview

This skill enables Jessica 3.0 to handle coding tasks by delegating to the `coding_agent` subagent.
Jessica remains the research orchestrator — she never writes code directly.
All code generation, execution, debugging, and file saving is handled by `coding_agent`.

## When to Trigger This Skill

Activate this skill when the user request contains any of the following intents:

- Writing a Python script, function, or module
- Executing or running existing code
- Debugging an error or traceback
- Automating a workflow or repetitive task
- Processing, parsing, or transforming data (CSV, JSON, API responses)
- Calling an external API programmatically
- Generating a chart, graph, or data visualization
- Reviewing or explaining code logic
- Installing a package or checking a dependency

## Delegation Workflow

### Step 1 — Classify the coding task
Identify what type of coding task is needed:

| Task Type          | Description                                        |
|--------------------|----------------------------------------------------|
| `generate`         | Write a new script or function from scratch        |
| `execute`          | Run existing code and return output                |
| `debug`            | Fix errors in existing code (up to 3 attempts)     |
| `data-processing`  | Parse, clean, or transform structured data         |
| `api-integration`  | Call an external API and handle the response       |
| `automation`       | Automate a multi-step workflow or file operation   |
| `visualization`    | Generate charts or graphs from data                |
| `explain`          | Explain what a piece of code does                  |

### Step 2 — Delegate to coding_agent
Pass a clear, structured task description to `coding_agent`: