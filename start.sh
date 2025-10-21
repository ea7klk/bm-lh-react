#!/bin/sh

# Start the Node.js backend in the background
cd /app/backend
PORT="${PORT:-3001}" \
DATABASE_URL="${DATABASE_URL}" \
NODE_ENV="${NODE_ENV:-production}" \
USE_MOCK_DATA="${USE_MOCK_DATA:-false}" \
ENABLE_BRANDMEISTER_SERVICE="${ENABLE_BRANDMEISTER_SERVICE:-true}" \
ENABLE_SUMMARY_SCHEDULER="${ENABLE_SUMMARY_SCHEDULER:-true}" \
JWT_SECRET="${JWT_SECRET}" \
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-7d}" \
EMAIL_HOST="${EMAIL_HOST}" \
EMAIL_PORT="${EMAIL_PORT}" \
EMAIL_USER="${EMAIL_USER}" \
EMAIL_PASSWORD="${EMAIL_PASSWORD}" \
EMAIL_FROM="${EMAIL_FROM}" \
EMAIL_SECURE="${EMAIL_SECURE}" \
EMAIL_REQUIRE_TLS="${EMAIL_REQUIRE_TLS}" \
FRONTEND_URL="${FRONTEND_URL}" \
APP_NAME="${APP_NAME}" \
APP_URL="${APP_URL}" \
node dist/server.js &

# Wait a moment for the backend to start
sleep 2

# Start nginx in the foreground
nginx -g "daemon off;"