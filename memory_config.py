import os
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

def _url_to_dsn(url: str) -> str:
    """Convert a postgres:// URL to a key=value conninfo string
    without decoding the password. If the password literally contains
    '%26', this ensures psycopg3 receives the exact string instead of
    incorrectly decoding it to '&'."""
    try:
        p = urlparse(url)
        host = p.hostname or "localhost"
        port = p.port or 5432
        dbname = (p.path or "/postgres").lstrip("/") or "postgres"
        user = unquote(p.username or "postgres")
        # DO NOT unquote the password. The literal string is required.
        password = p.password or ""
        # Escape backslash and single-quote for key=value conninfo format
        pw_esc = password.replace("\\", "\\\\").replace("'", "\\'")
        # Forward any query-string params (e.g. sslmode=require)
        extra = ""
        if p.query:
            for kv in p.query.split("&"):
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    extra += f" {k}={v}"
        return f"host={host} port={port} dbname={dbname} user={user} password='{pw_esc}'{extra}"
    except Exception:
        return url  # Fall back to raw URL on any parse error

_raw_conn = os.getenv(
    "POSTGRES_CONN_STRING",
    "postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable"
)

# Postgres connection string — used by fastAPI.py lifespan to spin up
# AsyncPostgresSaver + AsyncPostgresStore inside proper async context managers.
CONN_STRING = _url_to_dsn(_raw_conn)

# Embedding model — 384-dim, matches AsyncPostgresStore index config
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"}
)
