#!/bin/bash

# Complete Helios Testing Solution
echo "🚀 Complete Helios Testing Solution"
echo "===================================="

# Function to check if server is running
check_server() {
    curl -s http://localhost:3000 > /dev/null 2>&1
    return $?
}

# Function to start server in background
start_server() {
    echo "🌐 Starting test server..."
    node simple-test-server.js &
    SERVER_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..10}; do
        if check_server; then
            echo "✅ Server is running at http://localhost:3000"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Server failed to start"
    return 1
}

# Function to stop server
stop_server() {
    if [ ! -z "$SERVER_PID" ]; then
        echo "🛑 Stopping server..."
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
        echo "✅ Server stopped"
    fi
}

# Trap to cleanup on exit
trap stop_server EXIT

echo ""
echo "🔍 Checking current setup..."

# Check if server is already running
if check_server; then
    echo "✅ Test server is already running"
    USE_EXISTING=true
else
    echo "⚠️  Test server not running, will start it"
    USE_EXISTING=false
fi

echo ""
echo "📋 What would you like to do?"
echo "1) Run Puppeteer tests (recommended)"
echo "2) Open test page in browser"
echo "3) Run tests with visible browser"
echo "4) Start server only"
echo "5) Check test status"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🧪 Running Puppeteer tests..."
        
        if [ "$USE_EXISTING" = false ]; then
            start_server || exit 1
            sleep 2  # Give server extra time to fully start
        fi
        
        echo "🎭 Starting Puppeteer tests..."
        npm run test:helios:puppeteer
        
        if [ $? -eq 0 ]; then
            echo "✅ All tests passed!"
        else
            echo "❌ Some tests failed. Check the output above."
        fi
        ;;
        
    2)
        echo "🌐 Opening test page..."
        
        if [ "$USE_EXISTING" = false ]; then
            start_server || exit 1
            sleep 2
        fi
        
        echo "✅ Server ready at http://localhost:3000"
        echo "💡 Open this URL in your browser to test manually"
        echo "🎯 The page includes:"
        echo "   • WebAssembly support detection"
        echo "   • Mock Helios functionality"
        echo "   • Interactive testing interface"
        echo "   • Address validation"
        echo ""
        echo "Press Enter to continue (server will keep running)..."
        read
        ;;
        
    3)
        echo "👀 Running tests with visible browser..."
        
        if [ "$USE_EXISTING" = false ]; then
            start_server || exit 1
            sleep 2
        fi
        
        # Modify the Puppeteer test to run in headed mode
        echo "🎭 Starting tests in visible mode..."
        WEBPACK_BUILD_OUTPUT_PATH=webkit-dev jest --config=./tests/jest.config.js tests/puppeteer-helios/ --verbose
        ;;
        
    4)
        echo "🌐 Starting server only..."
        
        if [ "$USE_EXISTING" = true ]; then
            echo "✅ Server already running at http://localhost:3000"
        else
            start_server || exit 1
            echo "✅ Server started at http://localhost:3000"
            echo "🎯 You can now:"
            echo "   • Open http://localhost:3000 in browser"
            echo "   • Run ./test-helios-puppeteer.sh in another terminal"
            echo "   • Test the Helios integration manually"
        fi
        
        echo "Press Enter to stop the server..."
        read
        ;;
        
    5)
        echo "🔍 Checking test environment status..."
        echo ""
        
        echo "📊 System Status:"
        echo "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
        echo "NPM: $(npm --version 2>/dev/null || echo 'Not found')"
        echo ""
        
        echo "🌐 Server Status:"
        if check_server; then
            echo "✅ Test server is running at http://localhost:3000"
        else
            echo "❌ Test server is not running"
        fi
        echo ""
        
        echo "📁 Test Files:"
        if [ -f "tests/puppeteer-helios/helios-puppeteer.test.js" ]; then
            echo "✅ Puppeteer tests available"
            echo "   Tests: $(grep -c "test(" tests/puppeteer-helios/helios-puppeteer.test.js)"
        else
            echo "❌ Puppeteer tests not found"
        fi
        
        if [ -f "simple-test-server.js" ]; then
            echo "✅ Test server available"
        else
            echo "❌ Test server not found"
        fi
        
        if [ -d "src/web/assets/wasm" ]; then
            echo "✅ WASM files available:"
            ls -la src/web/assets/wasm/
        else
            echo "⚠️  WASM files not found (will use mocks)"
        fi
        
        echo ""
        echo "🚀 Ready to test Helios integration!"
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "✅ Operation completed!"
echo ""
echo "💡 Quick reference:"
echo "• Start server: node simple-test-server.js"
echo "• Run tests: ./test-helios-puppeteer.sh"
echo "• Test page: http://localhost:3000"
echo "• Full suite: ./test-helios-complete.sh"