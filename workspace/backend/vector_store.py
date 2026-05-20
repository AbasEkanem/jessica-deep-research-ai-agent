"""
Vector storage module for RAG agent.
Handles embeddings and similarity search using ChromaDB.
"""

import os
import logging
from typing import List, Optional, Dict, Any
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorStore:
    """Manages vector storage and similarity search for RAG pipeline."""
    
    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        collection_name: str = "rag_documents",
        embedding_model: str = "text-embedding-ada-002",
        use_local_embeddings: bool = False
    ):
        """
        Initialize vector store.
        
        Args:
            persist_directory: Directory to persist vector database
            collection_name: Name of the collection
            embedding_model: Name of the embedding model
            use_local_embeddings: Whether to use local HuggingFace embeddings
        """
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.use_local_embeddings = use_local_embeddings
        
        # Initialize embeddings
        self.embeddings = self._initialize_embeddings()
        
        # Initialize vector store
        self.vectorstore = None
        self._load_or_create_vectorstore()
    
    def _initialize_embeddings(self):
        """
        Initialize embedding model.
        
        Returns:
            Embeddings instance
        """
        if self.use_local_embeddings:
            logger.info("Using local HuggingFace embeddings")
            return HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
        else:
            logger.info(f"Using OpenAI embeddings: {self.embedding_model}")
            return OpenAIEmbeddings(
                model=self.embedding_model,
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
    
    def _load_or_create_vectorstore(self):
        """
        Load existing vector store or create new one.
        """
        # Create persist directory if it doesn't exist
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Try to load existing vector store
        try:
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                collection_name=self.collection_name,
                embedding_function=self.embeddings
            )
            logger.info(f"Loaded existing vector store from {self.persist_directory}")
        except Exception as e:
            logger.warning(f"Could not load existing vector store: {str(e)}")
            logger.info("Creating new vector store")
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                collection_name=self.collection_name,
                embedding_function=self.embeddings
            )
    
    def add_documents(self, documents: List[Document]) -> int:
        """
        Add documents to the vector store.
        
        Args:
            documents: List of Document objects to add
            
        Returns:
            Number of documents added
        """
        if not documents:
            logger.warning("No documents to add")
            return 0
        
        logger.info(f"Adding {len(documents)} documents to vector store")
        
        try:
            # Add documents with IDs
            ids = [f"doc_{i}" for i in range(len(documents))]
            self.vectorstore.add_documents(documents=documents, ids=ids)
            
            # Persist the vector store
            self.vectorstore.persist()
            
            logger.info(f"Successfully added {len(documents)} documents")
            return len(documents)
            
        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}")
            raise
    
    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Perform similarity search for query.
        
        Args:
            query: Search query text
            k: Number of results to return
            filter: Optional metadata filter
            
        Returns:
            List of similar Document objects
        """
        logger.info(f"Searching for: '{query}' (k={k})")
        
        try:
            results = self.vectorstore.similarity_search(
                query=query,
                k=k,
                filter=filter
            )
            
            logger.info(f"Found {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Error during similarity search: {str(e)}")
            raise
    
    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[tuple[Document, float]]:
        """
        Perform similarity search with relevance scores.
        
        Args:
            query: Search query text
            k: Number of results to return
            filter: Optional metadata filter
            
        Returns:
            List of (Document, score) tuples
        """
        logger.info(f"Searching with scores for: '{query}' (k={k})")
        
        try:
            results = self.vectorstore.similarity_search_with_score(
                query=query,
                k=k,
                filter=filter
            )
            
            logger.info(f"Found {len(results)} results with scores")
            return results
            
        except Exception as e:
            logger.error(f"Error during similarity search with scores: {str(e)}")
            raise
    
    def max_marginal_relevance_search(
        self,
        query: str,
        k: int = 4,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Perform max marginal relevance search for diverse results.
        
        Args:
            query: Search query text
            k: Number of results to return
            fetch_k: Number of results to fetch for MMR
            lambda_mult: Diversity factor (0-1)
            filter: Optional metadata filter
            
        Returns:
            List of diverse Document objects
        """
        logger.info(f"MMR search for: '{query}' (k={k}, lambda={lambda_mult})")
        
        try:
            results = self.vectorstore.max_marginal_relevance_search(
                query=query,
                k=k,
                fetch_k=fetch_k,
                lambda_mult=lambda_mult,
                filter=filter
            )
            
            logger.info(f"Found {len(results)} diverse results")
            return results
            
        except Exception as e:
            logger.error(f"Error during MMR search: {str(e)}")
            raise
    
    def delete_collection(self):
        """Delete the entire collection from vector store."""
        try:
            # Chroma doesn't have a direct delete method, so we recreate
            logger.warning(f"Deleting collection: {self.collection_name}")
            
            # Delete the persist directory
            import shutil
            if os.path.exists(self.persist_directory):
                shutil.rmtree(self.persist_directory)
                logger.info(f"Deleted {self.persist_directory}")
            
            # Recreate vector store
            self._load_or_create_vectorstore()
            
        except Exception as e:
            logger.error(f"Error deleting collection: {str(e)}")
            raise
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the vector store collection.
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.vectorstore._collection.count()
            
            return {
                "collection_name": self.collection_name,
                "document_count": count,
                "persist_directory": self.persist_directory,
                "embedding_model": self.embedding_model
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")
            return {
                "collection_name": self.collection_name,
                "document_count": 0,
                "error": str(e)
            }
    
    def as_retriever(self, **kwargs):
        """
        Get the vector store as a LangChain retriever.
        
        Args:
            **kwargs: Additional arguments for retriever
            
        Returns:
            LangChain Retriever object
        """
        return self.vectorstore.as_retriever(**kwargs)
