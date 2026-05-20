"""
Configuration module for RAG agent backend.
Handles environment variables and application settings.
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenAI Configuration
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    openai_embedding_model: str = Field(
        default="text-embedding-ada-002",
        env="OPENAI_EMBEDDING_MODEL"
    )
    
    # Backend Configuration
    backend_host: str = Field(default="0.0.0.0", env="BACKEND_HOST")
    backend_port: int = Field(default=8000, env="BACKEND_PORT")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )
    
    # Vector Store Configuration
    chroma_persist_directory: str = Field(
        default="./chroma_db",
        env="CHROMA_PERSIST_DIRECTORY"
    )
    chroma_collection_name: str = Field(
        default="rag_documents",
        env="CHROMA_COLLECTION_NAME"
    )
    
    # Document Processing
    chunk_size: int = Field(default=1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    max_documents: int = Field(default=100, env="MAX_DOCUMENTS")
    
    # RAG Configuration
    retrieval_k: int = Field(default=4, env="RETRIEVAL_K")
    temperature: float = Field(default=0.7, env="TEMPERATURE")
    max_tokens: int = Field(default=1000, env="MAX_TOKENS")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
