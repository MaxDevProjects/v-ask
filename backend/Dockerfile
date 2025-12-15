# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (includes native build for better-sqlite3)
RUN npm ci

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# su-exec (drop privileges after init)
RUN apk add --no-cache su-exec

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Remove devDependencies without requiring network access
RUN npm prune --omit=dev

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create writable data directory for SQLite
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
ENTRYPOINT ["/app/entrypoint.sh"]
