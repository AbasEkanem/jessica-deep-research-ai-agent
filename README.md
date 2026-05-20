# RAG Agent - Retrieval-Augmented Generation System

A modern, full-stack RAG (Retrieval-Augmented Generation) agent built with React, FastAPI, LangChain, and ChromaDB. Upload documents, ask questions, and get intelligent answers based on your knowledge base.

## Features

- Document Ingestion: Upload and process PDF, TXT, MD, and DOCX files
- Vector Embeddings: Automatic text chunking and embedding with OpenAI
- Semantic Search: Retrieve relevant documents using similarity search
- Intelligent Q&A: Get accurate answers based on your documents
- Modern UI: Clean, responsive React interface with Tailwind CSS
- Real-time Chat: Interactive chat interface with source citations
- System Monitoring: Track document statistics and system performance
- Configurable: Adjust temperature, token limits, and retrieval parameters

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.9+
- Node.js 18+
- npm or yarn
- OpenAI API Key

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rag-agent
```

### 2. Backend Setup

#### Create a Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server

```bash
# From the root directory
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Start the Frontend Development Server

```bash
# In a new terminal, from the frontend directory
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage Guide

### 1. Upload Documents

1. Navigate to the Documents tab
2. Click Select File or drag and drop a document
3. Supported formats: PDF, TXT, MD, DOCX
4. Wait for processing to complete
5. View statistics in the Knowledge Base section

### 2. Chat with Your Documents

1. Navigate to the Chat tab
2. Type your question in the input field
3. Press Enter or click the Send button
4. View the answer with source citations
5. Continue the conversation naturally

### 3. Monitor System Performance

1. Navigate to the Statistics tab
2. View document counts and system metrics
3. Monitor vector store status
4. Check embedding model information

### 4. Configure Parameters

1. Navigate to the Settings tab
2. Adjust generation parameters:
   - Temperature: Control randomness (0-2)
   - Max Tokens: Limit response length
   - Retrieval K: Number of documents to retrieve
3. Click Save Settings to apply changes

## Project Structure

```
rag-agent/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── document_ingestion.py # Document processing
│   ├── vector_store.py      # Vector database management
│   └── rag_pipeline.py      # RAG pipeline implementation
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx    # Chat UI component
│   │   │   ├── DocumentUpload.jsx  # Document upload UI
│   │   │   ├── SystemStats.jsx     # Statistics display
│   │   │   └── SettingsPanel.jsx   # Settings configuration
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   ├── utils/
│   │   │   └── helpers.js          # Utility functions
│   │   ├── App.jsx                 # Main application
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Configuration

### Environment Variables

Edit `.env` file to configure the application:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Vector Store Configuration
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=rag_documents

# Document Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_DOCUMENTS=100

# RAG Configuration
RETRIEVAL_K=4
TEMPERATURE=0.7
MAX_TOKENS=1000
```

### Parameter Guidelines

- Temperature (0-2): 
  - 0.0-0.3: Factual, focused answers
  - 0.4-0.7: Balanced responses
  - 0.8-1.0: Creative, diverse responses
  
- Max Tokens: 
  - 500-1000: Short to medium answers
  - 1000-2000: Detailed explanations
  - 2000+: Comprehensive responses
  
- Retrieval K: 
  - 2-4: Focused context
  - 5-8: Balanced context
  - 9+: Comprehensive context (slower)

## API Endpoints

### Health Check
```http
GET /health
```

### Query
```http
POST /query
Content-Type: application/json

{
  "question": "Your question here",
  "use_mmr": false,
  "return_source_documents": true
}
```

### Chat
```http
POST /chat
Content-Type: application/json

{
  "message": "Your message here",
  "history": []
}
```

### Upload Document
```http
POST /documents/upload
Content-Type: multipart/form-data

file: <binary>
```

### Get Statistics
```http
GET /stats
```

### Clear Documents
```http
DELETE /documents
```

### Update Parameters
```http
PUT /parameters?temperature=0.7&max_tokens=1000&retrieval_k=4
```

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Query example
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is RAG?"}'
```

### Test Frontend

Open `http://localhost:3000` in your browser and interact with the UI.

## Troubleshooting

### Backend Issues

**Problem**: ModuleNotFoundError: No module named 'langchain'

**Solution**: 
```bash
pip install -r requirements.txt
```

**Problem**: OpenAI API key not found

**Solution**: 
```bash
# Ensure .env file exists with OPENAI_API_KEY
cp .env.example .env
# Edit .env and add your API key
```

**Problem**: Port 8000 already in use

**Solution**: 
```bash
# Use a different port
python -m uvicorn backend.main:app --port 8001
```

### Frontend Issues

**Problem**: npm install fails

**Solution**: 
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Cannot connect to backend

**Solution**: 
- Ensure backend is running on port 8000
- Check CORS settings in `.env`
- Verify API URL in frontend

**Problem**: Port 3000 already in use

**Solution**: 
```bash
# Use a different port
npm run dev -- --port 3001
```

## Technology Stack

### Backend
- FastAPI: Modern, fast web framework for building APIs
- LangChain: Framework for developing applications with LLMs
- ChromaDB: Open-source embedding database
- OpenAI: GPT models and embeddings
- PyPDF: PDF document processing
- python-docx: Word document processing

### Frontend
- React 18: UI library
- Vite: Build tool and dev server
- Tailwind CSS: Utility-first CSS framework
- Lucide React: Icon library
- React Markdown: Markdown rendering
- Axios: HTTP client

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- LangChain team for the excellent framework
- OpenAI for powerful language models
- ChromaDB for the vector database
- The open-source community

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Roadmap

- Support for more document formats
- Multi-user support with authentication
- Conversation history persistence
- Advanced retrieval strategies (HyDE, Query Expansion)
- Support for local LLMs (Llama, Mistral)
- Document versioning
- Export chat conversations
- Batch document processing
- Real-time document collaboration

---

Built with love using React, FastAPI, and LangChain
