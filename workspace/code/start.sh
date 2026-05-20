#!/bin/bash

echo "Starting RAG Agent..."

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your OpenAI API key"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d venv ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start backend server in background
echo "Starting backend server..."
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Install frontend dependencies and start
echo "Installing frontend dependencies..."
cd frontend
npm install

# Start frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "RAG Agent is starting!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for interrupt signal
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
