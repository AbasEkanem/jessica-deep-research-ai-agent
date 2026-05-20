"""
FastAPI backend for RAG agent.
Provides REST API endpoints for document management and querying.
"""

import os
import shutil
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import RAG components
from config import settings
from document_ingestion import DocumentIngestion
from vector_store import VectorStore
from rag_pipeline import RAGPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RAG Agent API",
    description="Retrieval-Augmented Generation Agent API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
doc_ingestion = None
vector_store = None
rag_pipeline = None

# Upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Pydantic models for request/response
class QueryRequest(BaseModel):
    """Request model for query endpoint."""
    question: str
    use_mmr: bool = False
    return_source_documents: bool = True


class QueryResponse(BaseModel):
    """Response model for query endpoint."""
    answer: str
    source_documents: Optional[List[Dict[str, Any]]] = None
    metadata: Dict[str, Any]


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    source_documents: Optional[List[Dict[str, Any]]] = None
    metadata: Dict[str, Any]


class DocumentStats(BaseModel):
    """Document statistics model."""
    total_chunks: int
    total_characters: int
    avg_chunk_size: float
    unique_sources: int


class VectorStoreStats(BaseModel):
    """Vector store statistics model."""
    collection_name: str
    document_count: int
    persist_directory: str
    embedding_model: str


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize RAG components on startup."""
    global doc_ingestion, vector_store, rag_pipeline
    
    logger.info("Initializing RAG Agent backend...")
    
    try:
        # Initialize document ingestion
        doc_ingestion = DocumentIngestion(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap
        )
        logger.info("Document ingestion initialized")
        
        # Initialize vector store
        vector_store = VectorStore(
            persist_directory=settings.chroma_persist_directory,
            collection_name=settings.chroma_collection_name,
            embedding_model=settings.openai_embedding_model
        )
        logger.info("Vector store initialized")
        
        # Initialize RAG pipeline
        rag_pipeline = RAGPipeline(
            vector_store=vector_store,
            model_name=settings.openai_model,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
            retrieval_k=settings.retrieval_k
        )
        logger.info("RAG pipeline initialized")
        
        logger.info("RAG Agent backend ready!")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "components": {
            "document_ingestion": doc_ingestion is not None,
            "vector_store": vector_store is not None,
            "rag_pipeline": rag_pipeline is not None
        }
    }


# Document upload endpoint
@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document.
    
    Args:
        file: Uploaded file
        
    Returns:
        Processing result
    """
    if not doc_ingestion or not vector_store:
        raise HTTPException(
            status_code=503,
            detail="RAG components not initialized"
        )
    
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File uploaded: {file.filename}")
        
        # Process document
        chunks = doc_ingestion.process_document(file_path)
        
        # Add to vector store
        num_added = vector_store.add_documents(chunks)
        
        # Get statistics
        stats = doc_ingestion.get_document_stats(chunks)
        
        return {
            "message": "Document processed successfully",
            "filename": file.filename,
            "chunks_added": num_added,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Query endpoint
@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Query the RAG agent with a question.
    
    Args:
        request: Query request with question and options
        
    Returns:
        Query response with answer and sources
    """
    if not rag_pipeline:
        raise HTTPException(
            status_code=503,
            detail="RAG pipeline not initialized"
        )
    
    try:
        result = rag_pipeline.query(
            question=request.question,
            return_source_documents=request.return_source_documents,
            use_mmr=request.use_mmr
        )
        
        return QueryResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the RAG agent.
    
    Args:
        request: Chat request with message and history
        
    Returns:
        Chat response
    """
    if not rag_pipeline:
        raise HTTPException(
            status_code=503,
            detail="RAG pipeline not initialized"
        )
    
    try:
        # Convert history format if needed
        history = None
        if request.history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.history]
        
        result = rag_pipeline.chat(
            message=request.message,
            chat_history=history
        )
        
        return ChatResponse(
            response=result["answer"],
            source_documents=result.get("source_documents"),
            metadata=result["metadata"]
        )
        
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Get retrieved documents endpoint
@app.get("/retrieval/{query}")
async def get_retrieved_documents(
    query: str,
    k: int = Query(default=4, ge=1, le=10)
):
    """
    Get retrieved documents for a query without generating an answer.
    
    Args:
        query: Search query
        k: Number of documents to retrieve
        
    Returns:
        List of retrieved documents
    """
    if not rag_pipeline:
        raise HTTPException(
            status_code=503,
            detail="RAG pipeline not initialized"
        )
    
    try:
        docs = rag_pipeline.get_retrieved_documents(query=query, k=k)
        
        return {
            "query": query,
            "documents": docs,
            "count": len(docs)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Statistics endpoint
@app.get("/stats")
async def get_stats():
    """
    Get statistics about the RAG system.
    
    Returns:
        System statistics
    """
    if not vector_store:
        raise HTTPException(
            status_code=503,
            detail="Vector store not initialized"
        )
    
    try:
        vector_stats = vector_store.get_collection_stats()
        
        return {
            "vector_store": vector_stats,
            "upload_directory": UPLOAD_DIR,
            "uploaded_files": len(os.listdir(UPLOAD_DIR)) if os.path.exists(UPLOAD_DIR) else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Clear documents endpoint
@app.delete("/documents")
async def clear_documents():
    """
    Clear all documents from the vector store.
    
    Returns:
        Confirmation message
    """
    if not vector_store:
        raise HTTPException(
            status_code=503,
            detail="Vector store not initialized"
        )
    
    try:
        vector_store.delete_collection()
        
        # Clear upload directory
        if os.path.exists(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        
        return {
            "message": "All documents cleared successfully"
        }
        
    except Exception as e:
        logger.error(f"Error clearing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Update parameters endpoint
@app.put("/parameters")
async def update_parameters(
    temperature: Optional[float] = Query(default=None, ge=0.0, le=2.0),
    max_tokens: Optional[int] = Query(default=None, ge=1, le=4000),
    retrieval_k: Optional[int] = Query(default=None, ge=1, le=20)
):
    """
    Update RAG pipeline parameters.
    
    Args:
        temperature: New temperature value
        max_tokens: New max tokens value
        retrieval_k: New retrieval k value
        
    Returns:
        Updated parameters
    """
    if not rag_pipeline:
        raise HTTPException(
            status_code=503,
            detail="RAG pipeline not initialized"
        )
    
    try:
        rag_pipeline.update_parameters(
            temperature=temperature,
            max_tokens=max_tokens,
            retrieval_k=retrieval_k
        )
        
        return {
            "message": "Parameters updated successfully",
            "parameters": {
                "temperature": rag_pipeline.temperature,
                "max_tokens": rag_pipeline.max_tokens,
                "retrieval_k": rag_pipeline.retrieval_k
            }
        }
        
    except Exception as e:
        logger.error(f"Error updating parameters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Main entry point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )
