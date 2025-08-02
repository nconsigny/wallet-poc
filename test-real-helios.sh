#!/bin/bash

# Test the Real Helios Integration
echo "🔬 Testing Real Helios Integration"
echo "=================================="

echo "🌐 Starting test server with real Helios integration..."
echo ""
echo "📋 Instructions:"
echo "1. The server will start at http://localhost:3000"
echo "2. Open the page in your browser"
echo "3. UNCHECK the 'Use Mock Mode' checkbox"
echo "4. Wait for initialization (may take 30+ seconds)"
echo "5. Try the Get Balance, Get Block Number, and Get Chain ID buttons"
echo ""
echo "🔍 What to expect:"
echo "• WebAssembly Support: ✅ Supported"
echo "• WASM Files: ✅ Available" 
echo "• Mode should switch to 'Real Helios' if successful"
echo "• Real data from Ethereum mainnet"
echo ""
echo "⚠️  Note: Real Helios requires:"
echo "• Network connectivity"
echo "• Time to sync with consensus layer"
echo "• Working RPC endpoints"
echo ""

read -p "Press Enter to start the server..."

echo "🚀 Starting server..."
node simple-test-server.js