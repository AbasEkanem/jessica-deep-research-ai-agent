import sys
import os
import asyncio
import selectors

# Force UTF-8 output on Windows so emoji/Unicode in model responses don't crash
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    # Python 3.14: WindowsSelectorEventLoopPolicy is deprecated and no longer
    # reliable. Directly create and install a SelectorEventLoop instead.
    _selector_loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
    asyncio.set_event_loop(_selector_loop)

# Ensure the project root is on the import path before any local imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
import json
import traceback
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from pydantic import BaseModel, field_validator
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore
from memory_config import CONN_STRING, embedding_model
from JESSICA import get_jessica_agent

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Initialize the agent with persistent Postgres memory."""
    async with (
            AsyncPostgresSaver.from_conn_string(CONN_STRING) as checkpointer,
            AsyncPostgresStore.from_conn_string(
                CONN_STRING,
                index={
                    "dims": 384,
                    "embed": embedding_model,
                }
            ) as memory_store,
        ):
            # First-time setup (creates tables if missing)
            await checkpointer.setup()
            await memory_store.setup()
            
            app.state.agent = get_jessica_agent(checkpointer, memory_store)
            app.state.memory_store = memory_store
            print(f"[OK] Agent initialized - Persistent Postgres memory active")
            yield


app = FastAPI(
    title="Jessica - Deep Research AI Agent API",
    description="Multi-source investigative research agent with real-time streaming",
    version="3.0.0",
    lifespan=lifespan
)

# Build CORS origin list — avoid wildcard with allow_credentials=True
_cors_origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:3005", "http://localhost:3006"]
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    _cors_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StoryRequest(BaseModel):
    message: str
    thread_id: str = "default"
    user_id: str = "default"


    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()



@app.get("/")
async def root():
    # Serve frontend if unified deployment (static/ exists)
    if os.path.exists("static/index.html"):
        from fastapi.responses import FileResponse
        return FileResponse("static/index.html")
    return {
        "message": "Jessica API is running",
        "version": "3.0.0"
    }

@app.get("/api/threads/{thread_id}/history")
async def get_thread_history(http_request: Request, thread_id: str):
    agent = getattr(http_request.app.state, "agent", None)
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = await agent.aget_state(config)
        
        messages = []
        if state and hasattr(state, "values") and "messages" in state.values:
            for msg in state.values["messages"]:
                content = getattr(msg, "content", "")
                msg_type = getattr(msg, "type", "")
                
                # Only return actual conversational turns
                if msg_type not in ("human", "ai"):
                    continue
                    
                role = "user" if msg_type == "human" else "jessica"
                
                if content and isinstance(content, str):
                    messages.append({
                        "role": role,
                        "content": content
                    })
        return {"messages": messages}
    except Exception as e:
        print(f"[HISTORY ERROR] {e}")
        return {"messages": []}


@app.get("/health")
async def health():
    return {"status": "healthy"}


from langchain_core.callbacks import AsyncCallbackHandler


class JessicaStatusHandler(AsyncCallbackHandler):
    """Pushes selective status events to the SSE queue while the agent works."""

    _SEARCH_TOOLS = {
        "tavily_search", "serper_dev_search", "exa_search_tool",
        "ddgs_search_tool", "serpapi_search_tool", "linkup_search_tool",
    }

    _SEARCH_LABELS = {
        "tavily_search":       "Searching with Tavily…",
        "serper_dev_search":   "Searching with Google…",
        "exa_search_tool":     "Searching with Exa…",
        "ddgs_search_tool":    "Searching with DuckDuckGo…",
        "serpapi_search_tool": "Searching with SerpAPI…",
        "linkup_search_tool":  "Searching with Linkup…",
    }

    _SUBAGENT_LABELS = {
        "websearcher":  "Web Searcher",
        "email_agent":  "Email Agent",
        "coding_agent": "Coding Agent",
    }

    _UI_TOOLS = {
        "render_metric_row", "render_comparison_table", "render_action_buttons",
    }

    def __init__(self, queue: asyncio.Queue):
        super().__init__()
        self._queue = queue
        self._has_thought = False
        self._has_used_tools = False
        self._has_saved_memory = False
        self._has_read_memory = False

    async def _emit(self, phase: str, detail: str, tool: str = ""):
        payload = {"phase": phase, "detail": detail}
        if tool:
            payload["tool"] = tool
        await self._queue.put(
            f"data: {json.dumps({'type': 'status', 'data': payload})}\n\n"
        )

    async def on_llm_start(self, serialized, prompts, *, run_id, parent_run_id=None, tags=None, metadata=None, **kwargs):
        if not self._has_thought:
            self._has_thought = True
            await self._emit("thinking", "Thinking…")

    async def on_tool_start(self, serialized, input_str, *, run_id, parent_run_id=None, tags=None, metadata=None, inputs=None, **kwargs):
        name = serialized.get("name", "") if serialized else ""
        self._last_tool_name = name  # Track for on_tool_end

        # Search tools → emit "searching" phase
        if name in self._SEARCH_TOOLS:
            self._has_used_tools = True
            label = self._SEARCH_LABELS.get(name, f"Searching with {name}…")
            await self._emit("searching", label, tool=name)

        # Subagent delegation via `task` tool
        elif name == "task":
            self._has_used_tools = True
            subagent_name = ""
            if isinstance(input_str, dict):
                subagent_name = input_str.get("agent", input_str.get("name", ""))
            elif isinstance(input_str, str):
                for key in self._SUBAGENT_LABELS:
                    if key in input_str.lower():
                        subagent_name = key
                        break
            friendly = self._SUBAGENT_LABELS.get(subagent_name, "Sub-agent")
            await self._emit("subagent", f"{friendly} is working…")

        # Memory tools
        elif "memory" in name.lower():
            self._has_used_tools = True
            if "manage" in name.lower() or "save" in name.lower():
                self._has_saved_memory = True
                await self._emit("memory", "Saving to memory…", tool=name)
            else:
                self._has_read_memory = True
                await self._emit("memory", "Reading from memory…", tool=name)

        # UI rendering tools → emit status + tool event
        elif name in self._UI_TOOLS:
            self._has_used_tools = True
            await self._emit("writing", f"Rendering UI component…", tool=name)
            # Emit a tool event so the frontend shows the pill
            await self._queue.put(
                f"data: {json.dumps({'type': 'tool', 'data': {'name': name, 'timestamp': int(asyncio.get_event_loop().time() * 1000)}})}\n\n"
            )

        # All other tools → SILENT

    async def on_tool_end(self, output, *, run_id, parent_run_id=None, tags=None, **kwargs):
        """Detect UI tool returns and emit them as 'ui' SSE events."""
        name = getattr(self, "_last_tool_name", "")
        if name not in self._UI_TOOLS:
            return

        # Extract the UI payload from the tool output
        payload = None
        if isinstance(output, dict):
            payload = output
        elif isinstance(output, str):
            try:
                payload = json.loads(output)
            except (json.JSONDecodeError, TypeError):
                pass
        # Handle LangChain ToolMessage objects
        elif hasattr(output, "content"):
            content = output.content
            if isinstance(content, dict):
                payload = content
            elif isinstance(content, str):
                try:
                    payload = json.loads(content)
                except (json.JSONDecodeError, TypeError):
                    pass

        if payload and isinstance(payload, dict) and "type" in payload:
            await self._queue.put(
                f"data: {json.dumps({'type': 'ui', 'data': payload})}\n\n"
            )
            print(f"[UI EVENT] Emitted ui block: {payload.get('type')}", flush=True)


@app.post("/ask")
async def ask(http_request: Request, body: StoryRequest):
    """Run the agent to completion and stream status events + final response."""
    print(f"===================\n[ASK ENDPOINT HIT] thread_id={body.thread_id} message='{body.message}'\n===================", flush=True)
    agent = getattr(http_request.app.state, "agent", None)
    if not agent:
        raise HTTPException(
            status_code=500,
            detail="Jessica Agent failed to initialize"
        )

    # 1. Create a queue for this specific request
    queue = asyncio.Queue()

    # 2. Producer: Background task that runs agent to FULL completion
    async def run_agent_in_background():
        handler = JessicaStatusHandler(queue)
        try:
            from datetime import datetime
            current_time_str = datetime.now().strftime("%A, %B %d, %Y - %I:%M %p")
            enriched_message = f"[SYSTEM CONTEXT: The current exact date and time is {current_time_str}]\n\n{body.message}"

            # Run the agent to full completion — no streaming, no deadlock
            result = await agent.ainvoke(
                {"messages": [{"role": "user", "content": enriched_message}]},
                config={
                    "configurable": {"thread_id": body.thread_id},
                    "recursion_limit": 150,
                    "callbacks": [handler],
                }
            )

            # Extract the final AI response
            final_content = ""
            if result and "messages" in result:
                # The last AI message is the final response
                for msg in reversed(result["messages"]):
                    if getattr(msg, "type", "") == "ai" and getattr(msg, "content", ""):
                        final_content = msg.content
                        break

            if not final_content:
                final_content = "I completed the research but couldn't generate a final summary. Please try again."

            # Append memory success badges if used
            if handler._has_read_memory:
                final_content += "\n\n> 🧠 **Successfully retrieved from memory**"
            if handler._has_saved_memory:
                final_content += "\n\n> 🧠 **Successfully saved to memory**"

            # Emit composing step only for deep research (tools were used)
            if handler._has_used_tools:
                await handler._emit("writing", "Gathering and composing response…")
                await asyncio.sleep(0.4)
            else:
                await asyncio.sleep(0.2)

            # Send the COMPLETE response as one event
            await queue.put(
                f"data: {json.dumps({'type': 'response', 'data': final_content})}\n\n"
            )
            await queue.put("data: [DONE]\n\n")

        except Exception as e:
            print(f"[AGENT ERROR] {e}", flush=True)
            traceback.print_exc()
            await queue.put(f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n")
        finally:
            await queue.put(None)

    # Spawn the background task — survives client disconnects
    asyncio.create_task(run_agent_in_background())

    # 3. Consumer: Read from queue and yield to client (with keepalive)
    async def event_stream():
        try:
            while True:
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    # Send SSE comment as keepalive to prevent browser/proxy timeout
                    yield ": keepalive\n\n"
                    continue
                if msg is None:
                    break
                yield msg
        except asyncio.CancelledError:
            print(f"[DISCONNECT] Client disconnected. Jessica continues on thread {body.thread_id}.")
            raise

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        filename = os.path.basename(file.filename or "upload")
        UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, filename)

        contents = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        return {"filename": filename, "path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join("static", full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn

    if sys.platform == "win32":
        # Re-use the SelectorEventLoop we created at module load time.
        # Run uvicorn inside it directly so psycopg async works correctly.
        loop = asyncio.get_event_loop()
        config = uvicorn.Config(app, host="0.0.0.0", port=8000)
        server = uvicorn.Server(config)
        loop.run_until_complete(server.serve())
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000)