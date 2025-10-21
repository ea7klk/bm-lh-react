FROM node:20.18.0-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./

COPY frontend/ .
# Remove package-lock.json to avoid version conflicts and do fresh install
RUN rm -f package-lock.json && npm cache clean --force
# Install compatible ajv version first to avoid conflicts
RUN npm install ajv@^8.0.0 --save --legacy-peer-deps --force --no-audit --no-fund --silent
RUN npm install --legacy-peer-deps --force --no-audit --no-fund --silent
RUN npm run build

FROM node:20.18.0-alpine AS backend-builder

WORKDIR /app/backend

# Copy package files first for better caching
COPY backend/package*.json ./
RUN npm install --no-audit --no-fund --silent

COPY backend/ .
RUN npm run build

FROM node:20.18.0-alpine AS backend-deps

WORKDIR /app/backend

# Install build dependencies needed for native modules like bcrypt
RUN apk add --no-cache make gcc g++ python3

# Copy package files first for better caching
COPY backend/package*.json ./
RUN npm install --production --no-audit --no-fund --silent

FROM nginx:1.25-alpine

# Install Node.js runtime and build tools needed for bcrypt
RUN apk add --no-cache nodejs npm make gcc g++ python3

# Copy built frontend files
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# Copy backend files
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/database ./database
COPY --from=backend-deps /app/backend/node_modules ./node_modules

# Rebuild bcrypt for the Alpine Linux environment
RUN npm rebuild bcrypt

# Copy nginx configuration with API proxying
COPY nginx-combined.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]