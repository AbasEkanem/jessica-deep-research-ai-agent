from langchain.agents.middleware.types import AgentMiddleware, ModelRequest, ModelResponse
from langchain_core.messages import SystemMessage
from langgraph.store.base import BaseStore
import json

class AutoMemoryMiddleware(AgentMiddleware):
    """
    Proactive Memory Retrieval Middleware.
    
    In LangGraph/LangMem, the official pattern for memory is to fetch context 
    *before* the LLM sees the prompt. This middleware intercepts the incoming 
    request, queries the long-term BaseStore, and injects relevant memories 
    directly into the context window.
    """
    
    def __init__(self, store: BaseStore, namespace: tuple[str, ...] = ("jessica_memory_store",)):
        self.store = store
        self.namespace = namespace

    async def awrap_model_call(self, request: ModelRequest, call_next) -> ModelResponse:
        # 1. Grab the user's latest message
        if not request.messages:
            return await call_next(request)
            
        latest_msg = request.messages[-1]
        
        # We only want to search memory for User messages
        if latest_msg.type == "human" and isinstance(latest_msg.content, str):
            user_query = latest_msg.content
            # Extract user_id from the LangGraph runnable config
            from langchain_core.runnables.config import ensure_config
            try:
                config = ensure_config()
                user_id = config.get("configurable", {}).get("user_id", "default")
            except Exception:
                user_id = "default"
            
            # Construct the user-scoped namespace (e.g. ("jessica_memory_store", "jerome"))
            active_namespace = self.namespace + (user_id,)
            
            # 2. Search the LangGraph BaseStore
            try:
                memories = await self.store.asearch(
                    active_namespace,
                    query=user_query,
                    limit=5
                )
                
                # 3. If we found relevant memories, inject them into the context
                if memories:
                    # Convert to string gracefully depending on what format the memory is in
                    memory_bullets = []
                    for m in memories:
                        if isinstance(m.value, dict):
                            memory_bullets.append(f"- {json.dumps(m.value)}")
                        else:
                            memory_bullets.append(f"- {m.value}")

                    if memory_bullets:
                        bullet_str = "\n".join(memory_bullets)
                        injection = SystemMessage(
                            content=(
                                "🧠 PROACTIVE MEMORY RECALL:\n"
                                "The following facts from your long-term memory are relevant "
                                "to the user's current query:\n"
                                f"{bullet_str}\n\n"
                                "CRITICAL INSTRUCTION: Do NOT explicitly mention or repeat these facts to the user "
                                "unless they directly ask about them or they are strictly required to answer the prompt. "
                                "Use this information silently as background context to shape your persona."
                            )
                        )
                        
                        # Ensure we don't permanently mutate the underlying LangGraph state history
                        new_messages = request.messages.copy()
                        
                        # Insert it right after the main system prompt (index 1)
                        new_messages.insert(1, injection)
                        request.messages = new_messages
            except Exception as e:
                # If store search fails for any reason, fail gracefully and continue
                print(f"[MemoryMiddleware] Failed to retrieve memory: {e}")

        # 4. Continue the execution flow to the actual Agent/LLM
        return await call_next(request)
