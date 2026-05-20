# --- Stage 1: Build Frontend ---
FROM node:20-slim AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# --- Stage 2: Final Backend Image ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for psycopg and other tools
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir psycopg[binary]

# Copy application code
COPY . .

# Copy the built frontend from Stage 1 into the 'static' folder
COPY --from=ui-builder /app/ui/out ./static

# Ensure the static folder is recognized by FastAPI
ENV PORT=8080
EXPOSE 8080

# Run the unified app
CMD ["python", "fastAPI.py"]
