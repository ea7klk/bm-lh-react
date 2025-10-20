#!/bin/bash

# Test script for summary API endpoints
# Make sure your backend server is running before executing this script

set -e

BASE_URL="http://localhost:3001/api"
CURRENT_TIME=$(date +%s)
WEEK_AGO=$((CURRENT_TIME - 604800))  # 7 days ago

echo "Testing Summary API Endpoints"
echo "=============================="

# Test 1: Get processing status
echo "1. Testing GET /api/summary/status"
curl -s "$BASE_URL/summary/status" | jq '.' || echo "Failed or server not running"
echo ""

# Test 2: Trigger manual processing
echo "2. Testing POST /api/summary/process"
curl -s -X POST "$BASE_URL/summary/process" | jq '.' || echo "Failed"
echo ""

# Test 3: Get talkgroup activity (last week)
echo "3. Testing GET /api/summary/talkgroups (last week)"
curl -s "$BASE_URL/summary/talkgroups?startTime=$WEEK_AGO&endTime=$CURRENT_TIME&limit=10" | jq '.' || echo "Failed"
echo ""

# Test 4: Get hourly activity (last 24 hours)
YESTERDAY=$((CURRENT_TIME - 86400))
echo "4. Testing GET /api/summary/hourly (last 24 hours)"
curl -s "$BASE_URL/summary/hourly?startTime=$YESTERDAY&endTime=$CURRENT_TIME" | jq '.' || echo "Failed"
echo ""

# Test 5: Get callsigns for a specific talkgroup (example: talkgroup 91)
echo "5. Testing GET /api/summary/talkgroups/91/callsigns"
curl -s "$BASE_URL/summary/talkgroups/91/callsigns?startTime=$WEEK_AGO&endTime=$CURRENT_TIME" | jq '.' || echo "Failed"
echo ""

echo "Testing completed. Check output for any errors."
echo ""
echo "Common issues:"
echo "- If 'command not found: jq', install jq with: brew install jq (macOS) or apt install jq (Ubuntu)"
echo "- If connection refused, make sure backend server is running on port 3001"
echo "- If empty results, make sure summary tables have been created and populated"