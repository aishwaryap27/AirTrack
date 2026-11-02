# Multi-stage production build for React frontend

# Stage 1: Build the static bundle using Node.js 22
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies deterministically
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build production assets to /app/dist
RUN npm run build

# Stage 2: Serve static assets through Nginx
FROM nginx:alpine

# Remove default Nginx site configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy production Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Health check verifying Nginx is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
