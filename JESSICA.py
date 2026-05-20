# agent.py
from deepagents import create_deep_agent, FilesystemPermission
from deepagents.backends import FilesystemBackend
from load_env import chat_model
from JESSICA_prompt import system_prompt as _jessica_instructions
from pathlib import Path
from load_subagents import load_jessica_subagents as _subagent_loader
from datetime_tools import date_time_tools
from memory_middleware import AutoMemoryMiddleware
from memory_manager import memory_tools as _memory_management_tools
from ui_tools import render_metric_row, render_comparison_table, render_action_buttons

# Base directory — all relative paths (memory, skills, backend) anchor here
BASE_DIR = Path(__file__).parent

def get_jessica_agent(checkpointer, store):
    """
    Factory function — creates and returns a fully wired Jessica 3.0 agent.

    Args:
        checkpointer: A LangGraph checkpointer for state persistence.
        store: A LangGraph BaseStore instance for long-term memory.

    Returns:
        A compiled deepagents graph ready for .astream() / .ainvoke() calls.
    """

    jessica_tools = (
        _memory_management_tools
        + date_time_tools
        + [render_metric_row, render_comparison_table, render_action_buttons]
    )

    # Orchestrator filesystem permissions — restrict the auto-injected
    # deepagents filesystem tools (ls, read_file, write_file, edit_file,
    # glob, grep) so the orchestrator can't reflexively edit files.
    # Skills and JESSICA.md are read-only (loaded at startup by the framework).
    # /workspace/ is the only writable area (for context offloading).
    orchestrator_permissions = [
        # Deny writes to the agent identity file — never self-edit
        FilesystemPermission(operations=["write"], paths=["/JESSICA.md"], mode="deny"),
        # Allow reads for startup loading and workspace context reading
        FilesystemPermission(operations=["read"], paths=["/JESSICA.md", "/skills/**", "/workspace/**"]),
        # Allow writes only to workspace (context offloading)
        FilesystemPermission(operations=["write"], paths=["/workspace/**"]),
        # Deny all other writes
        FilesystemPermission(operations=["write"], paths=["/**"], mode="deny"),
    ]

    jessica = create_deep_agent(
        model=chat_model,
        tools=jessica_tools,
        system_prompt=_jessica_instructions,
        checkpointer=checkpointer,
        store=store,
        memory=["/JESSICA.md"],
        skills=["./skills"],
        subagents=_subagent_loader(BASE_DIR / "subagents.yaml"),
        backend=FilesystemBackend(root_dir=BASE_DIR),
        permissions=orchestrator_permissions,
        middleware=[AutoMemoryMiddleware(store=store)],
    )
    return jessica