# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build && \
    npx tsc ormconfig.ts --module commonjs --target ES2021 --esModuleInterop true --outDir dist --skipLibCheck true && \
    test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found!" && exit 1) && \
    test -f dist/ormconfig.js || (echo "ERROR: dist/ormconfig.js not found!" && exit 1)

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir -p uploads/temp uploads/legal-documents && \
    chown -R nestjs:nodejs /usr/src/app

USER nestjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "NODE_ENV=production node node_modules/typeorm/cli.js migration:run -d dist/ormconfig.js && node dist/src/main.js"]
