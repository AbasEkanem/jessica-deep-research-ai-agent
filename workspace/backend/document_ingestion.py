"""
Document ingestion module for RAG agent.
Handles loading and processing various document formats.
"""

import os
from typing import List, Dict, Any
from pathlib import Path
import logging

# Document loaders
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader,
    UnstructuredMarkdownLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentIngestion:
    """Handles document ingestion and processing for RAG pipeline."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize document ingestion service.
        
        Args:
            chunk_size: Maximum size of text chunks
            chunk_overlap: Overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Supported file extensions and their loaders
        self.loaders = {
            '.pdf': PyPDFLoader,
            '.txt': TextLoader,
            '.md': UnstructuredMarkdownLoader,
            '.docx': Docx2txtLoader,
            '.doc': Docx2txtLoader,
        }
    
    def get_loader(self, file_path: str):
        """
        Get appropriate loader for file based on extension.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Document loader instance
            
        Raises:
            ValueError: If file type is not supported
        """
        ext = Path(file_path).suffix.lower()
        
        if ext not in self.loaders:
            raise ValueError(
                f"Unsupported file type: {ext}. "
                f"Supported types: {list(self.loaders.keys())}"
            )
        
        loader_class = self.loaders[ext]
        return loader_class(file_path)
    
    def load_document(self, file_path: str) -> List[Document]:
        """
        Load a single document file.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            List of Document objects
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file type is not supported
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        logger.info(f"Loading document: {file_path}")
        
        try:
            loader = self.get_loader(file_path)
            documents = loader.load()
            
            # Add metadata
            for doc in documents:
                doc.metadata['source'] = file_path
                doc.metadata['filename'] = os.path.basename(file_path)
            
            logger.info(f"Loaded {len(documents)} pages/sections from {file_path}")
            return documents
            
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {str(e)}")
            raise
    
    def load_documents_from_directory(self, directory: str) -> List[Document]:
        """
        Load all supported documents from a directory.
        
        Args:
            directory: Path to directory containing documents
            
        Returns:
            List of Document objects from all files
        """
        if not os.path.exists(directory):
            raise FileNotFoundError(f"Directory not found: {directory}")
        
        all_documents = []
        supported_files = []
        
        # Find all supported files
        for root, _, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                ext = Path(file_path).suffix.lower()
                if ext in self.loaders:
                    supported_files.append(file_path)
        
        logger.info(f"Found {len(supported_files)} supported documents in {directory}")
        
        # Load each document
        for file_path in supported_files:
            try:
                documents = self.load_document(file_path)
                all_documents.extend(documents)
            except Exception as e:
                logger.warning(f"Failed to load {file_path}: {str(e)}")
                continue
        
        logger.info(f"Total documents loaded: {len(all_documents)}")
        return all_documents
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into chunks for embedding and retrieval.
        
        Args:
            documents: List of Document objects to split
            
        Returns:
            List of chunked Document objects
        """
        logger.info(f"Splitting {len(documents)} documents into chunks")
        
        chunks = self.text_splitter.split_documents(documents)
        
        logger.info(f"Created {len(chunks)} chunks")
        logger.info(f"Average chunk size: {sum(len(c.page_content) for c in chunks) / len(chunks):.0f} characters")
        
        return chunks
    
    def process_document(self, file_path: str) -> List[Document]:
        """
        Complete pipeline: load and split a document.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            List of chunked Document objects
        """
        documents = self.load_document(file_path)
        chunks = self.split_documents(documents)
        return chunks
    
    def process_directory(self, directory: str) -> List[Document]:
        """
        Complete pipeline: load and split all documents in directory.
        
        Args:
            directory: Path to directory containing documents
            
        Returns:
            List of chunked Document objects
        """
        documents = self.load_documents_from_directory(directory)
        chunks = self.split_documents(documents)
        return chunks
    
    def get_document_stats(self, chunks: List[Document]) -> Dict[str, Any]:
        """
        Get statistics about processed documents.
        
        Args:
            chunks: List of chunked Document objects
            
        Returns:
            Dictionary with statistics
        """
        if not chunks:
            return {
                "total_chunks": 0,
                "total_characters": 0,
                "avg_chunk_size": 0,
                "unique_sources": 0
            }
        
        total_chars = sum(len(chunk.page_content) for chunk in chunks)
        unique_sources = len(set(chunk.metadata.get('source', '') for chunk in chunks))
        
        return {
            "total_chunks": len(chunks),
            "total_characters": total_chars,
            "avg_chunk_size": total_chars / len(chunks),
            "unique_sources": unique_sources
        }
