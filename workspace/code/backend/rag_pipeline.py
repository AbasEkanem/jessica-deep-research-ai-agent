from typing import Dict, List, Optional
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from backend.config import settings

class RAGPipeline:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.llm = None
        self.qa_chain = None
        self.temperature = settings.default_temperature
        self.max_tokens = settings.default_max_tokens
        self.k = settings.default_k
        self._initialize()
    
    def _initialize(self):
        """Initialize the RAG pipeline"""
        try:
            if not settings.openai_api_key:
                print("Warning: OpenAI API key not set. RAG pipeline will not be functional.")
                return
            
            # Initialize LLM
            self.llm = ChatOpenAI(
                openai_api_key=settings.openai_api_key,
                model=settings.openai_model,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Create custom prompt
            prompt_template = """Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context: {context}

Question: {question}

Answer:"""
            
            PROMPT = PromptTemplate(
                template=prompt_template,
                input_variables=["context", "question"]
            )
            
            # Create retrieval chain
            if self.vector_store.is_initialized():
                retriever = self.vector_store.vectorstore.as_retriever(
                    search_kwargs={"k": self.k}
                )
                
                self.qa_chain = RetrievalQA.from_chain_type(
                    llm=self.llm,
                    chain_type="stuff",
                    retriever=retriever,
                    return_source_documents=True,
                    chain_type_kwargs={"prompt": PROMPT}
                )
                
                print("RAG pipeline initialized successfully")
            else:
                print("Warning: Vector store not initialized. RAG pipeline not fully functional.")
                
        except Exception as e:
            print(f"Error initializing RAG pipeline: {e}")
    
    def update_settings(self, temperature: Optional[float] = None, 
                       max_tokens: Optional[int] = None,
                       k: Optional[int] = None):
        """Update pipeline settings"""
        if temperature is not None:
            self.temperature = temperature
        if max_tokens is not None:
            self.max_tokens = max_tokens
        if k is not None:
            self.k = k
        
        # Reinitialize with new settings
        self._initialize()
    
    def query(self, question: str) -> Dict:
        """Query the RAG system"""
        if not self.qa_chain:
            return {
                "answer": "RAG pipeline not initialized. Please check your OpenAI API key.",
                "sources": []
            }
        
        try:
            # Get response
            result = self.qa_chain({"query": question})
            
            # Extract answer and sources
            answer = result.get("result", "No answer generated")
            source_docs = result.get("source_documents", [])
            
            # Format sources
            sources = []
            for doc in source_docs:
                sources.append({
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get("source", "unknown")
                })
            
            return {
                "answer": answer,
                "sources": sources
            }
            
        except Exception as e:
            return {
                "answer": f"Error processing query: {str(e)}",
                "sources": []
            }
    
    def is_ready(self) -> bool:
        """Check if pipeline is ready"""
        return self.qa_chain is not None
