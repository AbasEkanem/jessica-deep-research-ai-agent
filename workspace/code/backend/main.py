from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
from backend.document_ingestion import DocumentIngestion
from backend.vector_store import VectorStore
from backend.rag_pipeline import RAGPipeline

app = FastAPI(title="RAG Agent API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
doc_ingestion = DocumentIngestion()
vector_store = VectorStore()
rag_pipeline = RAGPipeline(vector_store)

class QueryRequest(BaseModel):
    query: str
    k: Optional[int] = 4
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 500

class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]
    query_time: float

@app.get("/")
async def root():
    return {"message": "RAG Agent API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "vector_store": vector_store.is_initialized(),
        "document_count": vector_store.get_document_count()
    }

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        # Save uploaded file
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Process document
        chunks = doc_ingestion.process_document(file_path)
        
        # Add to vector store
        vector_store.add_documents(chunks, metadata={"source": file.filename})
        
        # Clean up
        os.remove(file_path)
        
        return {
            "message": "Document uploaded successfully",
            "filename": file.filename,
            "chunks_processed": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Query the RAG system"""
    try:
        import time
        start_time = time.time()
        
        # Update pipeline settings
        rag_pipeline.update_settings(
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            k=request.k
        )
        
        # Get response
        result = rag_pipeline.query(request.query)
        
        query_time = time.time() - start_time
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            query_time=query_time
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def list_documents():
    """List all uploaded documents"""
    try:
        docs = vector_store.list_documents()
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document"""
    try:
        vector_store.delete_document(doc_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
