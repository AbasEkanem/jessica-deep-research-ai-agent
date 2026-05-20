"""
RAG (Retrieval-Augmented Generation) pipeline module.
Handles the complete RAG workflow: retrieval and generation.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from langchain.schema import Document
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.chains.question_answering import load_qa_chain

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGPipeline:
    """Manages the RAG pipeline for question answering."""
    
    def __init__(
        self,
        vector_store,
        model_name: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        retrieval_k: int = 4
    ):
        """
        Initialize RAG pipeline.
        
        Args:
            vector_store: VectorStore instance for retrieval
            model_name: OpenAI model name
            temperature: Generation temperature
            max_tokens: Maximum tokens in response
            retrieval_k: Number of documents to retrieve
        """
        self.vector_store = vector_store
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.retrieval_k = retrieval_k
        
        # Initialize LLM
        self.llm = self._initialize_llm()
        
        # Initialize QA chain
        self.qa_chain = self._initialize_qa_chain()
        
        # Initialize retrieval QA chain
        self.retrieval_qa = self._initialize_retrieval_qa()
    
    def _initialize_llm(self):
        """
        Initialize the language model.
        
        Returns:
            ChatOpenAI instance
        """
        logger.info(f"Initializing LLM: {self.model_name}")
        
        return ChatOpenAI(
            model_name=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
    
    def _initialize_qa_chain(self):
        """
        Initialize the QA chain with custom prompt.
        
        Returns:
            QA chain instance
        """
        # Custom prompt template
        prompt_template = """You are a helpful assistant that answers questions based on the provided context. 
Use the following pieces of context to answer the question at the end. 
If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}

Answer:"""
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        logger.info("Initializing QA chain")
        
        return load_qa_chain(
            self.llm,
            chain_type="stuff",
            prompt=PROMPT
        )
    
    def _initialize_retrieval_qa(self):
        """
        Initialize the retrieval QA chain.
        
        Returns:
            RetrievalQA instance
        """
        logger.info("Initializing RetrievalQA chain")
        
        retriever = self.vector_store.as_retriever(
            search_kwargs={"k": self.retrieval_k}
        )
        
        return RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
    
    def query(
        self,
        question: str,
        return_source_documents: bool = True,
        use_mmr: bool = False
    ) -> Dict[str, Any]:
        """
        Query the RAG pipeline with a question.
        
        Args:
            question: User's question
            return_source_documents: Whether to return source documents
            use_mmr: Whether to use Max Marginal Relevance for diverse results
            
        Returns:
            Dictionary with answer and metadata
        """
        logger.info(f"Processing query: '{question}'")
        
        try:
            # Retrieve relevant documents
            if use_mmr:
                docs = self.vector_store.max_marginal_relevance_search(
                    query=question,
                    k=self.retrieval_k
                )
            else:
                docs = self.vector_store.similarity_search(
                    query=question,
                    k=self.retrieval_k
                )
            
            if not docs:
                logger.warning("No relevant documents found")
                return {
                    "answer": "I couldn't find any relevant information in the documents to answer your question.",
                    "source_documents": [],
                    "metadata": {
                        "num_documents_retrieved": 0,
                        "question": question
                    }
                }
            
            # Generate answer using QA chain
            result = self.qa_chain(
                {"input_documents": docs, "question": question},
                return_only_outputs=True
            )
            
            answer = result.get("output_text", "").strip()
            
            # Prepare response
            response = {
                "answer": answer,
                "metadata": {
                    "num_documents_retrieved": len(docs),
                    "question": question,
                    "model": self.model_name
                }
            }
            
            # Add source documents if requested
            if return_source_documents:
                source_docs = []
                for doc in docs:
                    source_docs.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata
                    })
                response["source_documents"] = source_docs
            
            logger.info(f"Generated answer with {len(docs)} source documents")
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            raise
    
    def query_with_retrieval_qa(self, question: str) -> Dict[str, Any]:
        """
        Query using RetrievalQA chain (simpler approach).
        
        Args:
            question: User's question
            
        Returns:
            Dictionary with answer and source documents
        """
        logger.info(f"Processing query with RetrievalQA: '{question}'")
        
        try:
            result = self.retrieval_qa({"query": question})
            
            answer = result.get("result", "")
            source_documents = result.get("source_documents", [])
            
            # Format source documents
            formatted_sources = []
            for doc in source_documents:
                formatted_sources.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata
                })
            
            return {
                "answer": answer,
                "source_documents": formatted_sources,
                "metadata": {
                    "num_documents_retrieved": len(source_documents),
                    "question": question,
                    "model": self.model_name
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing query with RetrievalQA: {str(e)}")
            raise
    
    def chat(
        self,
        message: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Chat with the RAG agent (conversational interface).
        
        Args:
            message: User's message
            chat_history: List of previous chat messages
            
        Returns:
            Dictionary with response and metadata
        """
        logger.info(f"Processing chat message: '{message}'")
        
        # For now, use the query method
        # In a full implementation, you would use ConversationalRetrievalChain
        result = self.query(message, return_source_documents=True)
        
        return result
    
    def get_retrieved_documents(
        self,
        query: str,
        k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Get retrieved documents without generating an answer.
        
        Args:
            query: Search query
            k: Number of documents to retrieve
            
        Returns:
            List of retrieved documents with metadata
        """
        logger.info(f"Retrieving documents for: '{query}'")
        
        try:
            docs = self.vector_store.similarity_search(query=query, k=k)
            
            formatted_docs = []
            for doc in docs:
                formatted_docs.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata
                })
            
            return formatted_docs
            
        except Exception as e:
            logger.error(f"Error retrieving documents: {str(e)}")
            raise
    
    def update_parameters(
        self,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        retrieval_k: Optional[int] = None
    ):
        """
        Update pipeline parameters.
        
        Args:
            temperature: New temperature value
            max_tokens: New max tokens value
            retrieval_k: New retrieval k value
        """
        if temperature is not None:
            self.temperature = temperature
            self.llm.temperature = temperature
            logger.info(f"Updated temperature to {temperature}")
        
        if max_tokens is not None:
            self.max_tokens = max_tokens
            self.llm.max_tokens = max_tokens
            logger.info(f"Updated max_tokens to {max_tokens}")
        
        if retrieval_k is not None:
            self.retrieval_k = retrieval_k
            # Update retriever
            retriever = self.vector_store.as_retriever(
                search_kwargs={"k": retrieval_k}
            )
            self.retrieval_qa.retriever = retriever
            logger.info(f"Updated retrieval_k to {retrieval_k}")
