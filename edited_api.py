# import sys
# import asyncio
# import selectors

# import os
# import json
# import traceback
# from fastapi import FastAPI, HTTPException, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel, field_validator
# from contextlib import asynccontextmanager
# from typing import AsyncGenerator
# from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
# from langgraph.store.postgres.aio import AsyncPostgresStore
# from memory_config import CONN_STRING, embedding_model
# import importlib.util as _ilu
# from pathlib import Path as _Path

# _spec = _ilu.spec_from_file_location(
#     "JESSICA3_0",
#     _Path(__file__).parent / "JESSICA3.0.py"
# )
# _mod = _ilu.module_from_spec(_spec)
# _spec.loader.exec_module(_mod)
# get_jessica_agent = _mod.get_jessica_agent

# sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# @asynccontextmanager
# async def lifespan(app: FastAPI) -> AsyncGenerator:
#     """Initialize Postgres checkpointer, store and agent on startup."""
#     try:
#         async with (
#             AsyncPostgresSaver.from_conn_string(CONN_STRING) as checkpointer,
#             AsyncPostgresStore.from_conn_string(
#                 CONN_STRING,
#                 index={
#                     "dims": 384,
#                     "embed": embedding_model,
#                 }
#             ) as memory_store,
#         ):
#             await checkpointer.setup()
#             await memory_store.setup()

#             app.state.agent = get_jessica_agent(
#                 checkpointer, memory_store
#             )
#             app.state.memory_store = memory_store
#             print("[OK] Agent initialized — AsyncPostgresSaver + AsyncPostgresStore")

#             yield  # server runs here

#     except Exception as e:
#         print(f"[CRITICAL ERROR] Failed to initialize agent lifespan: {e}")
#         traceback.print_exc()
#         raise


# app = FastAPI(
#     title="Jessica 3.0 - Deep Research AI Agent API",
#     description="Multi-source investigative research agent with real-time streaming",
#     version="3.0.0",
#     lifespan=lifespan
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://localhost:3000",
#         os.getenv("FRONTEND_URL", "*")
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# class StoryRequest(BaseModel):
#     query: str
#     sessionId: str = "default"

#     @field_validator("query")
#     @classmethod
#     def query_not_empty(cls, v: str) -> str:
#         if not v or not v.strip():
#             raise ValueError("Query cannot be empty")
#         return v.strip()


# @app.get("/")
# async def root():
#     return {
#         "message": "Jessica 3.0 API is running",
#         "version": "3.0.0"
#     }


# @app.get("/health")
# async def health():
#     return {"status": "healthy"}


# @app.post("/ask")
# async def ask(http_request: Request, body: StoryRequest):
#     """Stream a response based on user query."""
#     agent = getattr(http_request.app.state, "agent", None)
#     if not agent:
#         raise HTTPException(
#             status_code=500,
#             detail="MiSol Agent failed to initialize"
#         )

#     async def event_stream():
#         try:
#             async for chunk in agent.astream(
#                 {"messages": [{"role": "user", "content": body.query}]},
#                 config={"configurable": {"thread_id": body.sessionId}},
#                 stream_mode="updates",
#             ):
#                 if isinstance(chunk, dict):
#                     for node_name, node_update in chunk.items():
#                         if isinstance(node_update, dict) and "messages" in node_update:
#                             new_messages = node_update["messages"]
#                             if not isinstance(new_messages, list):
#                                 new_messages = [new_messages]

#                             for msg in reversed(new_messages):
#                                 content = getattr(msg, "content", None)
#                                 msg_type = getattr(msg, "type", None)
#                                 if msg_type in ("ai", "tool") and content:
#                                     yield f"data: {json.dumps({'type': 'content', 'data': content})}\n\n"
#                                     break

#             yield "data: [DONE]\n\n"

#         except Exception as e:
#             print(f"[STREAM ERROR] {e}")
#             traceback.print_exc()
#             yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"

#     return StreamingResponse(event_stream(), media_type="text/event-stream")


# if __name__ == "__main__":
#     import uvicorn

#     config = uvicorn.Config(
#         "fastAPI:app",
#         host="0.0.0.0",
#         port=int(os.getenv("PORT", 8080)),
#         reload=False,
#     )
#     server = uvicorn.Server(config)

#     if sys.platform == "win32":
#         # psycopg async requires SelectorEventLoop — ProactorEventLoop (Windows default) is incompatible.
#         # Use loop_factory to force SelectorEventLoop regardless of Python version.
#         asyncio.run(
#             server.serve(),
#             loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()),
#         )
#     else:
#         asyncio.run(server.serve())