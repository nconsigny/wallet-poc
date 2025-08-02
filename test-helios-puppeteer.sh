#!/bin/bash

# Helios Puppeteer Testing Script
# Uses the existing Puppeteer setup to test Helios integration

echo "🎭 Helios Testing with Puppeteer (Existing Setup)"
echo "================================================="

echo "🔍 Checking existing test setup..."

# Check if Jest and Puppeteer are available
if [ -f "tests/jest.config.js" ]; then
    echo "✅ Jest config found"
else
    echo "❌ Jest config not found"
    exit 1
fi

if grep -q "jest-puppeteer" package.json; then
    echo "✅ Puppeteer testing setup found"
else
    echo "❌ Puppeteer testing setup not found"
    exit 1
fi

echo ""
echo "🚀 Available test options:"
echo "1) Run Helios Puppeteer tests only"
echo "2) Run all existing tests + Helios tests"
echo "3) Run with development server"
echo "4) Check test file syntax"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🧪 Running Helios Puppeteer tests..."
        WEBPACK_BUILD_OUTPUT_PATH=webkit-dev jest --config=./tests/jest.config.js tests/puppeteer-helios/
        ;;
    2)
        echo "🧪 Running all tests including Helios..."
        WEBPACK_BUILD_OUTPUT_PATH=webkit-dev jest --config=./tests/jest.config.js
        ;;
    3)
        echo "🌐 Starting with development server..."
        echo "Note: Make sure to start 'npm run web:webkit' in another terminal first"
        read -p "Press Enter when dev server is running..."
        WEBPACK_BUILD_OUTPUT_PATH=webkit-dev jest --config=./tests/jest.config.js tests/puppeteer-helios/
        ;;
    4)
        echo "🔍 Checking test file syntax..."
        node -c tests/puppeteer-helios/helios-puppeteer.test.js
        if [ $? -eq 0 ]; then
            echo "✅ Test file syntax is valid"
            echo "📊 Test file statistics:"
            wc -l tests/puppeteer-helios/helios-puppeteer.test.js
            grep -c "test(" tests/puppeteer-helios/helios-puppeteer.test.js | xargs echo "Number of tests:"
        else
            echo "❌ Test file has syntax errors"
        fi
        ;;
    *)
        echo "❌ Invalid choice. Running Helios tests by default..."
        WEBPACK_BUILD_OUTPUT_PATH=webkit-dev jest --config=./tests/jest.config.js tests/puppeteer-helios/
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "💡 Tips:"
echo "• The tests use your existing Puppeteer setup"
echo "• Make sure your dev server is running on localhost:3000"
echo "• Check the Jest output for detailed results"
echo "• Tests simulate Helios functionality without requiring real WASM"