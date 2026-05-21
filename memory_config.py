import os
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

# Postgres connection string — used by fastAPI.py lifespan to spin up
# AsyncPostgresSaver + AsyncPostgresStore inside proper async context managers.
CONN_STRING = os.getenv(
    "POSTGRES_CONN_STRING",
    "postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable"
)

# Embedding model — 384-dim, matches AsyncPostgresStore index config
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"}
)
