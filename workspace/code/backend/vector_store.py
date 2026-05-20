from typing import List, Optional, Dict
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.docstore.document import Document
from backend.config import settings
import os

class VectorStore:
    def __init__(self):
        self.embeddings = None
        self.vectorstore = None
        self._initialized = False
        self._initialize()
    
    def _initialize(self):
        """Initialize the vector store"""
        try:
            if not settings.openai_api_key:
                print("Warning: OpenAI API key not set. Vector store will not be fully functional.")
                return
            
            self.embeddings = OpenAIEmbeddings(
                openai_api_key=settings.openai_api_key,
                model=settings.openai_embedding_model
            )
            
            # Create or load existing vector store
            persist_directory = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                settings.vector_db_path
            )
            
            if os.path.exists(persist_directory):
                self.vectorstore = Chroma(
                    persist_directory=persist_directory,
                    embedding_function=self.embeddings,
                    collection_name=settings.collection_name
                )
            else:
                os.makedirs(persist_directory, exist_ok=True)
                self.vectorstore = Chroma(
                    persist_directory=persist_directory,
                    embedding_function=self.embeddings,
                    collection_name=settings.collection_name
                )
            
            self._initialized = True
            print(f"Vector store initialized at {persist_directory}")
            
        except Exception as e:
            print(f"Error initializing vector store: {e}")
    
    def is_initialized(self) -> bool:
        """Check if vector store is initialized"""
        return self._initialized
    
    def add_documents(self, documents: List[Document], metadata: Optional[Dict] = None):
        """Add documents to the vector store"""
        if not self._initialized:
            raise RuntimeError("Vector store not initialized. Check OpenAI API key.")
        
        # Add metadata to each document
        if metadata:
            for doc in documents:
                doc.metadata.update(metadata)
        
        self.vectorstore.add_documents(documents)
        print(f"Added {len(documents)} documents to vector store")
    
    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Search for similar documents"""
        if not self._initialized:
            raise RuntimeError("Vector store not initialized. Check OpenAI API key.")
        
        return self.vectorstore.similarity_search(query, k=k)
    
    def similarity_search_with_score(self, query: str, k: int = 4) -> List[tuple]:
        """Search for similar documents with scores"""
        if not self._initialized:
            raise RuntimeError("Vector store not initialized. Check OpenAI API key.")
        
        return self.vectorstore.similarity_search_with_score(query, k=k)
    
    def get_document_count(self) -> int:
        """Get total number of documents in the store"""
        if not self._initialized:
            return 0
        
        try:
            return self.vectorstore._collection.count()
        except:
            return 0
    
    def list_documents(self) -> List[Dict]:
        """List all documents in the store"""
        if not self._initialized:
            return []
        
        try:
            # Get all documents with metadata
            results = self.vectorstore.get()
            documents = []
            
            if results and 'metadatas' in results:
                for i, metadata in enumerate(results['metadatas']):
                    doc_info = {
                        'id': results.get('ids', [])[i] if i < len(results.get('ids', [])) else f"doc_{i}",
                        'source': metadata.get('source', 'unknown'),
                        'metadata': metadata
                    }
                    documents.append(doc_info)
            
            return documents
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []
    
    def delete_document(self, doc_id: str):
        """Delete a document by ID"""
        if not self._initialized:
            raise RuntimeError("Vector store not initialized.")
        
        try:
            self.vectorstore.delete(ids=[doc_id])
            print(f"Deleted document {doc_id}")
        except Exception as e:
            print(f"Error deleting document: {e}")
            raise
    
    def clear_all(self):
        """Clear all documents from the store"""
        if not self._initialized:
            raise RuntimeError("Vector store not initialized.")
        
        try:
            # Delete all documents
            self.vectorstore.delete(where={})
            print("Cleared all documents from vector store")
        except Exception as e:
            print(f"Error clearing documents: {e}")
            raise
