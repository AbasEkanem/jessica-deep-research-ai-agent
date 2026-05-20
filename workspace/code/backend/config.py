from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # OpenAI Settings
    openai_api_key: str = ""
    openai_model: str = "gpt-3.5-turbo"
    openai_embedding_model: str = "text-embedding-ada-002"
    
    # Vector Store Settings
    vector_db_path: str = "./chroma_db"
    collection_name: str = "rag_documents"
    
    # RAG Settings
    chunk_size: int = 1000
    chunk_overlap: int = 200
    default_k: int = 4
    default_temperature: float = 0.7
    default_max_tokens: int = 500
    
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
