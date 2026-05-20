import subprocess
import shlex
import sys
import os
from langchain_core.tools import tool
from langchain_community.agent_toolkits import FileManagementToolkit
from pathlib import Path

# Anchor to project root
BASE_DIR = Path(__file__).parent
WORKSPACE_DIR = BASE_DIR / "workspace"
WORKSPACE_DIR.mkdir(exist_ok=True)


@tool
def execute_python(code: str) -> str:
    """
    Execute Python code in an isolated subprocess and return the printed output.
    Use this to run scripts, fetch data from APIs, process data, or compute results.
    CRITICAL: You MUST use print() to display values. Only printed output is returned.
    """
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=str(WORKSPACE_DIR),
            env=os.environ.copy()
        )
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if result.returncode != 0:
            # Script crashed — return the full traceback so the agent can self-debug
            return f"Python execution failed:\n{stderr}"

        if stdout:
            return stdout
        elif stderr:
            # Non-fatal warnings (e.g. DeprecationWarning)
            return f"Script completed with warnings:\n{stderr}"
        else:
            return (
                "Script ran successfully but produced no output. "
                "Add print() statements to display variable values."
            )
    except subprocess.TimeoutExpired:
        return "Python execution timed out after 30 seconds. Simplify the script or break into smaller steps."
    except Exception as e:
        return f"Python execution failed: {str(e)}"


#  Shell executor 

_ALLOWED_COMMANDS = {
    "git", "python", "python3", "pytest",
    "pip", "ls", "dir", "cat", "type", "echo",
    "mkdir", "pwd", "find", "cd"
}

# Map Unix-style commands to Windows equivalents when on Windows
_WIN_CMD_MAP = {
    "ls":   "dir",
    "cat":  "type",
    "pwd":  "cd",
    "find": "dir /s /b",
}


@tool
def execute_shell(command: str) -> str:
    """
    Execute a safe shell command and return stdout/stderr.
    Allowed: git, python, python3, pytest, pip, ls, cat, echo, mkdir, pwd, find, cd.
    Dangerous commands (rm, sudo, chmod, chown, del, format) are blocked.
    """
    try:
        # Translate Unix-style commands to Windows equivalents
        if sys.platform == "win32":
            stripped = command.strip()
            # If the agent tries to use Unix paths/flags with Windows builtins (like ls /workspace), it crashes.
            # Catch this early and tell them to use Python.
            if stripped.startswith(("ls /", "ls -", "find /", "cat /")):
                return "Shell Error: Unix flags/paths are not supported on Windows shell. Use python's os module instead."
                
            for unix_cmd, win_cmd in _WIN_CMD_MAP.items():
                if stripped == unix_cmd or stripped.startswith(unix_cmd + " "):
                    command = win_cmd + stripped[len(unix_cmd):]
                    break

        # Parse the command safely
        try:
            parts = shlex.split(command, posix=(sys.platform != "win32"))
        except ValueError:
            parts = command.split()

        if not parts:
            return "Empty command."

        base_cmd = parts[0].lower().rstrip(".exe")
        if base_cmd not in _ALLOWED_COMMANDS:
            return (
                f"Command '{parts[0]}' is not permitted. "
                f"Allowed: {sorted(_ALLOWED_COMMANDS)}"
            )

        # On Windows, builtins (dir, cd, type, mkdir) MUST run via shell=True
        use_shell = False
        if sys.platform == "win32":
            # If the base command is a shell builtin, we need shell=True
            if base_cmd in ["dir", "cd", "type", "mkdir", "echo", "pwd", "ls", "cat"]:
                use_shell = True
                # For builtins on Windows, it's often better to pass the raw command string
                # instead of a list of parts when using shell=True
                exec_cmd = command
            else:
                exec_cmd = parts
        else:
            exec_cmd = parts

        result = subprocess.run(
            exec_cmd,
            shell=use_shell,
            capture_output=True,
            text=True,
            timeout=30,
            cwd=str(WORKSPACE_DIR),
            env=os.environ.copy()
        )
        output = result.stdout or ""
        errors = result.stderr or ""
        if errors:
            if "Parameter format not correct" in errors:
                 return "Shell Error: Invalid Windows flag used. Please use execute_python with the os/shutil modules for file operations instead of execute_shell."
            output += f"\n[stderr]: {errors}"
        return output.strip() if output.strip() else "Command completed with no output."
    except subprocess.TimeoutExpired:
        return "Shell command timed out after 30 seconds."
    except FileNotFoundError as e:
        return (
            f"Shell command failed — executable not found: {e}. "
            "Tip: use execute_python instead for scripting tasks on Windows."
        )
    except Exception as e:
        return f"Shell execution failed: {str(e)}"


#  File management

_file_toolkit_tools = {
    t.name: t
    for t in FileManagementToolkit(
        root_dir=str(WORKSPACE_DIR),
        selected_tools=["read_file", "write_file", "list_directory"],
    ).get_tools()
}


@tool
def read_file(file_path: str) -> str:
    """
    Read and return the contents of a file from the workspace.
    Use this to inspect existing scripts, configs, or research outputs.
    """
    try:
        return _file_toolkit_tools["read_file"].invoke({"file_path": file_path})
    except Exception as e:
        return f"Failed to read file '{file_path}': {str(e)}"


@tool
def write_file(file_path: str, text: str) -> str:
    """
    Write content to a file inside the workspace.
    Convention: always save generated scripts to workspace/code/[filename].py
    MANDATORY: save every generated script before returning results to Jessica.
    """
    try:
        return _file_toolkit_tools["write_file"].invoke({"file_path": file_path, "text": text})
    except Exception as e:
        return f"Failed to write file '{file_path}': {str(e)}"


@tool
def list_directory(dir_path: str) -> str:
    """
    List files and directories inside the workspace.
    Pass dir_path as the directory to list (e.g. 'code').
    """
    try:
        return _file_toolkit_tools["list_directory"].invoke({"dir_path": dir_path})
    except Exception as e:
        return f"Failed to list directory '{dir_path}': {str(e)}"


# Code reflection tool

@tool(parse_docstring=True)
def code_reflection_tool(reflection: str) -> str:
    """Tool for strategic reflection on coding progress and decision-making.

    Use this after writing or executing code to assess quality and plan next steps.

    Reflection should address:
    1. Code Quality - Is the code clean, well-commented, and PEP8 compliant?
    2. Execution Results - Did the code run without errors? What was the output?
    3. Debugging Status - Were all errors resolved? How many attempts were made?
    4. File Saved - Was the script saved to /workspace/code/ using write_file?
    5. Completeness - Does the code fully solve the requested task?
    6. Next Steps - What improvements or follow-up actions are recommended?

    Args:
        reflection (str): Your detailed reflection on the coding task progress and quality.

    Returns:
        str: Confirmation that the reflection has been recorded.
    """
    return f"Code reflection recorded: {reflection}"


# Register and export the coding tool list

coding_tools = [
    execute_python,
    # execute_shell removed: all file-system ops should use Python (os, pathlib)
    # on Windows, execute_shell causes "Parameter format not correct" crashes
    read_file,
    write_file,
    list_directory,
    code_reflection_tool,
]