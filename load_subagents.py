# unlike skills and agents.md files that are loaded in the deep agent,
# the subagents are not same, here we create the load_subagent function to load the subagent.
from pathlib import Path
import yaml
from websearch_api import websearch_tools as _web_tools
from email_api import email_tools as _email_sender
from coding_api import coding_tools as _coding_tools
from load_env import chat_model


def load_jessica_subagents(config_path: Path) -> list:
    """Load subagent definitions from YAML and wire up tools.
    
    NOTE: This is a custom utility for this example. Unlike `memory` and `skills`,
    deepagents doesn't natively load subagents from files - they're normally
    defined inline in the create_deep_agent() call. We externalize to YAML here
    to keep configuration separate from code.
    """
    # Map tool names to actual tool objects
    available_tools = {
        "websearch_tools": _web_tools,
        "email_tools":     _email_sender,
        "coding_tools":    _coding_tools,
    }

    with open(config_path) as f:
        config = yaml.safe_load(f)

    subagents = []
    for name, spec in config.items():
        subagent = {
            "name": name,
            "description": spec["description"],
            "system_prompt": spec["system_prompt"],
        }
        
        # Handle model resolution
        raw_model = spec.get("model")
        if raw_model == "chat_model":
            subagent["model"] = chat_model
        elif raw_model:
            subagent["model"] = raw_model
            
        if "tools" in spec:
            resolved_tools = []
            for t in spec["tools"]:
                tool_val = available_tools.get(t)
                if isinstance(tool_val, list):
                    resolved_tools.extend(tool_val)
                elif tool_val:
                    resolved_tools.append(tool_val)
            subagent["tools"] = resolved_tools
        subagents.append(subagent)

    return subagents