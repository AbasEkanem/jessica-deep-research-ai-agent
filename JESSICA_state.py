# lets build a stateful deep researh ai agent - JESSICA3.0
# A state aware deep research AI agent built by  Ekanem, Abasi-ikpongke (Emryz) - April 2026.
from langgraph.graph import MessagesState
from typing_extensions import  TypedDict
from typing import NotRequired, Literal, Annotated

# create the jessica agent state

class Todo(TypedDict):
    task_status : Literal["pending", "in-progress", "completed"]
    task_description : str

# create the file_reducer
def file_reducer(left:dict[str,str]|None, right:dict[str,str]|None)->dict[str|str]|None:
    if left is None:
        return right
    elif right is None:
        return left
    else:
        return{**left,**right}

# create the Jessica agent state that will extend the agentstate with Todo and file_reducer
class Jessica_agentState(MessagesState):
    todos: NotRequired[list[Todo]]
    files: Annotated[NotRequired[dict[str,str]],file_reducer]
