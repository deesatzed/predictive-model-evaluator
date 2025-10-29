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

# Serve static build with Nginx
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
