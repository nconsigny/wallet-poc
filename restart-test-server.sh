#!/bin/bash

echo "🔄 Restarting Helios Test Server"
echo "================================"

# Kill any existing server on port 3000
echo "🛑 Stopping any existing server..."
pkill -f "node simple-test-server.js" 2>/dev/null || true
sleep 1

# Check if port is free
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 still occupied, trying to free it..."
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 2
fi

echo "🚀 Starting fresh server..."
node simple-test-server.js