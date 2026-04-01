# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files first (better Docker layer caching)
COPY package*.json ./

# Install ALL dependencies including devDependencies needed for build
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
    echo "Build successful" && \
    ls -la dist/ && \
    test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found after build!" && exit 1)

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist

# Create uploads directories with correct permissions
RUN mkdir -p /usr/src/app/uploads/temp /usr/src/app/uploads/legal-documents && \
    chown -R nestjs:nodejs /usr/src/app/uploads

# Switch to non-root user
USER nestjs

# Expose port (Railway will override this)
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/src/main.js"]
