# Multi-stage Dockerfile for A-D-AGENT
FROM node:18-alpine AS frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Go backend stage
FROM golang:1.23-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache git

# Build backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o backend/main backend/main.go

# Final runtime stage
FROM python:3.11-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy built backend
COPY --from=backend-builder /app/backend/main ./backend/
COPY --from=backend-builder /app/config.go ./
COPY --from=backend-builder /app/helper ./helper/
COPY --from=backend-builder /app/go.mod ./
COPY --from=backend-builder /app/go.sum ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Create necessary directories
RUN mkdir -p /app/tmp /app/logs

# Create flags.txt file with proper permissions
RUN touch /app/flags.txt && chmod 666 /app/flags.txt

# Install Python dependencies commonly used in exploits
RUN pip install --no-cache-dir requests pycryptodome beautifulsoup4 urllib3

# Expose port 1337
EXPOSE 1337

# Create startup script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV GIN_MODE=release
ENV PORT=1337

ENTRYPOINT ["/app/docker-entrypoint.sh"]
