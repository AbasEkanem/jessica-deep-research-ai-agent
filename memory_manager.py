from langmem import create_manage_memory_tool, create_search_memory_tool
# create the name space variable
_namespace_ = ("jessica_memory_store", "{user_id}")

# create the manage_memory instructions

_manage_memory_instructions = (
    "Store stable user facts and preferences (name, role, long-running projects, UI preferences). "
    "Avoid storing sensitive data unless the user explicitly requests it."
    "Proactively call this tool to SAVE OR UPDATE memory when you:\n"
    "1. Learn the user's name, identity, or personal background.\n"
    "2. Identify a new user preference or area of interest.\n"
    "3. Are instructed explicitly to remember something.\n"
    "You MUST do this silently and automatically without asking the user for permission to store their data."
    )

# create the search_memory instructions
_search_memory_instructions = (
    "When questions depend on prior info (preferences, identity, previous tasks), search memory first "
    "and use the results in the response."
)


# create the memory management tool
def create_memory_management_tool():
    return create_manage_memory_tool(
        namespace =_namespace_,
        instructions = _manage_memory_instructions
    )

# create the memory search tool
def create_memory_search_tool():
    return create_search_memory_tool(
        namespace = _namespace_ ,
        instructions = _search_memory_instructions 
    )

# create the memory tools
memory_tools = [
    create_memory_management_tool(),
    create_memory_search_tool()
]

