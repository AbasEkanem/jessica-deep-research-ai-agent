# RAG Agent - React + FastAPI

A full-stack Retrieval-Augmented Generation (RAG) agent with a modern React frontend and Python FastAPI backend. Upload documents, ask questions, and get AI-powered answers with source citations.

## Features

- Document Upload: Support for PDF, TXT, MD, and DOCX files
- Smart Retrieval: Vector-based similarity search using ChromaDB
- AI-Powered Answers: OpenAI GPT integration for intelligent responses
- Real-time Chat: Interactive chat interface with message history
- Source Citations: View source documents for each response
- System Statistics: Monitor document count and system health
- Configurable Settings: Adjust retrieval and generation parameters
- Modern UI: Clean, responsive interface with Tailwind CSS

## Tech Stack

### Backend
- FastAPI: Modern, fast web framework for building APIs
- LangChain: Framework for building LLM applications
- ChromaDB: Vector database for document storage
- OpenAI: GPT models for text generation and embeddings
- PyPDF2, python-docx: Document processing libraries

### Frontend
- React: UI library
- Vite: Fast build tool and dev server
- Tailwind CSS: Utility-first CSS framework
- Lucide React: Beautiful icon library
- Axios: HTTP client for API requests

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- OpenAI API key

## Quick Start

### 1. Navigate to Project Directory

```bash
cd C:\Users\Bussiness Sensor\Desktop\jessica_project\workspace\code
```

### 2. Configure Environment

Copy the example environment file and add your OpenAI API key:

**Windows:**
```cmd
copy .env.example .env
```

**Unix/Linux/Mac:**
```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Run the Application

**Windows:**
```cmd
start.bat
```

**Unix/Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Start the backend server (http://localhost:8000)
- Start the frontend (http://localhost:3000)

### 4. Open in Browser

Navigate to: http://localhost:3000

## Manual Setup

### Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

### 1. Upload Documents

- Go to the Documents tab
- Drag and drop files or click "Browse Files"
- Supported formats: PDF, TXT, MD, DOCX
- Documents are automatically processed and indexed

### 2. Ask Questions

- Go to the Chat tab
- Type your question in the input field
- Click "Send" or press Enter
- View the AI response with source citations

### 3. View Statistics

- Go to the Statistics tab
- See document count, vector store status, and system info

### 4. Adjust Settings

- Go to the Settings tab
- Configure retrieval parameters (K value)
- Adjust generation settings (temperature, max tokens)
- Save your preferences

## API Endpoints

### Health Check
```http
GET /api/health
```

### Upload Document
```http
POST /api/upload
Content-Type: multipart/form-data

file: <document_file>
```

### Query RAG System
```http
POST /api/query
Content-Type: application/json

{
  "query": "your question here",
  "k": 4,
  "temperature": 0.7,
  "max_tokens": 500
}
```

### List Documents
```http
GET /api/documents
```

### Delete Document
```http
DELETE /api/documents/{doc_id}
```

## Project Structure

```
code/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── document_ingestion.py # Document processing
│   ├── vector_store.py      # ChromaDB integration
│   └── rag_pipeline.py      # RAG pipeline logic
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── SystemStats.jsx
│   │   │   └── SettingsPanel.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── requirements.txt
├── .env.example
├── .gitignore
├── start.bat
├── start.sh
└── README.md
```

## Configuration

### Environment Variables

Edit `.env` file to configure:

- OPENAI_API_KEY: Your OpenAI API key (required)
- OPENAI_MODEL: GPT model to use (default: gpt-3.5-turbo)
- OPENAI_EMBEDDING_MODEL: Embedding model (default: text-embedding-ada-002)
- VECTOR_DB_PATH: Path to ChromaDB storage (default: ./chroma_db)
- CHUNK_SIZE: Document chunk size (default: 1000)
- CHUNK_OVERLAP: Chunk overlap (default: 200)
- DEFAULT_K: Default retrieval count (default: 4)
- DEFAULT_TEMPERATURE: Default temperature (default: 0.7)
- DEFAULT_MAX_TOKENS: Default max tokens (default: 500)

## Troubleshooting

### Backend won't start
- Check that Python 3.8+ is installed
- Verify virtual environment is activated
- Ensure all dependencies are installed
- Check that OpenAI API key is set in `.env`

### Frontend won't start
- Check that Node.js 16+ is installed
- Verify you're in the `frontend` directory
- Run `npm install` to install dependencies

### Documents not uploading
- Check file format is supported (PDF, TXT, MD, DOCX)
- Verify backend is running on port 8000
- Check browser console for errors

### No responses from queries
- Ensure documents are uploaded
- Check OpenAI API key is valid
- Verify vector store is initialized
- Check backend logs for errors

## Development

### Backend Development

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run with auto-reload
python -m uvicorn backend.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The build output will be in frontend/dist/
```

## License

MIT License - feel free to use this project for any purpose.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
