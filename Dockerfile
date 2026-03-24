# Freemen Printer Proxy
# Multi-architecture Docker image (AMD64 + ARM64)
# Compatible with: Linux servers, Raspberry Pi, and other ARM64 devices

FROM node:20-alpine

LABEL org.opencontainers.image.title="Freemen Printer Proxy"
LABEL org.opencontainers.image.description="Local proxy for Brother QL/TD label printers"
LABEL org.opencontainers.image.vendor="Freemen Solutions"
LABEL org.opencontainers.image.source="https://github.com/Potarius/freemen-printer-proxy"

WORKDIR /app

# Install system dependencies for network scanning
RUN apk add --no-cache wget

# Copy dependency files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY server.js ./
COPY lib/ ./lib/
COPY middleware/ ./middleware/
COPY public/ ./public/

# Create required directories with proper permissions
RUN mkdir -p logs data && \
    chown -R node:node /app

# Use non-root user for security
USER node

# Expose application port
EXPOSE 6500

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:6500/health || exit 1

# Start the service
CMD ["node", "server.js"]
