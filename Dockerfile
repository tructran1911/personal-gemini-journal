# Multi-stage build for Personal Gemini Journal (Production Cloud Run)
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build Client Frontend
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# 2. Build Server Backend
COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server/ ./server/
RUN cd server && npm run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY server/package*.json ./
RUN npm ci --only=production

# Copy compiled backend
COPY --from=builder /app/server/dist ./dist

# Copy built static frontend
COPY --from=builder /app/client/dist ./public

EXPOSE 8080

CMD ["node", "dist/index.js"]
