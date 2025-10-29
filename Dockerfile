# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_GEMINI_API_KEY
ARG VITE_OPENROUTER_API_KEY
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
ENV VITE_OPENROUTER_API_KEY=${VITE_OPENROUTER_API_KEY}
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Serve static build with Node (Express) to enable /api endpoints
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]
