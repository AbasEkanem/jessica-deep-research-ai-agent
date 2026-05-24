# --- Monolithic Image ---
FROM python:3.11-slim

# Install system dependencies, including curl for Node.js setup
RUN apt-get update && apt-get install -y \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (v20)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir psycopg[binary]

# Pre-download the embedding model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')" || true

# Copy all files
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Build the Next.js frontend
WORKDIR /app/ui
RUN npm ci
# We do not use output: standalone because next-auth needs the standard next start server
RUN npm run build

# Expose port (Cloud Run sets PORT, usually 8080)
EXPOSE 8080

WORKDIR /app
CMD ["./start.sh"]
