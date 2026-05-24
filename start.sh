#!/bin/bash

# Cloud Run defines PORT, default to 8080 if not set.
export PORT=${PORT:-8080}
# Ensure FastAPI does NOT bind to the Cloud Run PORT!
export BACKEND_PORT=8000

# Start the FastAPI backend on port 8000 in the background
echo "Starting FastAPI backend on port $BACKEND_PORT..."
cd /app
PORT=$BACKEND_PORT python fastAPI.py &

# Wait a moment for the backend to initialize
sleep 2

# Start the Next.js frontend on the main PORT
echo "Starting Next.js frontend on port ${PORT}..."
cd /app/ui
npm start &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
