import os
from dotenv import load_dotenv

load_dotenv()

# Postgres connection string — used by fastAPI.py lifespan to spin up
# AsyncPostgresSaver + AsyncPostgresStore inside proper async context managers.
CONN_STRING = os.getenv(
    "POSTGRES_CONN_STRING",
    "postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable"
)

# Embedding model — 384-dim, matches AsyncPostgresStore index config
# Lazy-loaded to avoid blocking server startup on Cloud Run
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from langchain_huggingface import HuggingFaceEmbeddings
        _embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
    return _embedding_model

# Keep backward compatibility — imported as `embedding_model` elsewhere
class _LazyEmbedding:
    """Proxy that delays HuggingFace model download until first use."""
    def __getattr__(self, name):
        return getattr(get_embedding_model(), name)
    def __call__(self, *args, **kwargs):
        return get_embedding_model()(*args, **kwargs)

embedding_model = _LazyEmbedding()
