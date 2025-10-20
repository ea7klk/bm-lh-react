#!/bin/sh

# Start the Node.js backend in the background
cd /app/backend
PORT=3001 \
DATABASE_URL="${DATABASE_URL}" \
NODE_ENV="${NODE_ENV:-production}" \
USE_MOCK_DATA="${USE_MOCK_DATA:-false}" \
ENABLE_BRANDMEISTER_SERVICE="${ENABLE_BRANDMEISTER_SERVICE:-true}" \
node dist/server.js &

# Wait a moment for the backend to start
sleep 2

# Start nginx in the foreground
nginx -g "daemon off;"