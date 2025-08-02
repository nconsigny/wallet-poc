#!/bin/bash

# Helios Playwright Testing Script
# This script helps you run Playwright tests for the Helios integration

set -e

echo "🚀 Helios Playwright Test Runner"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
if npm install --legacy-peer-deps; then
    echo "✅ Dependencies installed successfully"
else
    echo "⚠️  Dependency installation had issues, but continuing..."
    echo "💡 You may want to run 'npm install --legacy-peer-deps' manually later"
fi

echo "🎭 Installing Playwright browsers..."
if npx playwright install; then
    echo "✅ Playwright browsers installed successfully"
else
    echo "❌ Failed to install Playwright browsers"
    echo "💡 Try running 'npx playwright install' manually"
    exit 1
fi

echo "🔧 Available test commands:"
echo ""
echo "1. Run all Helios tests:              npm run test:playwright:helios"
echo "2. Run with UI (interactive):         npm run test:playwright:ui"
echo "3. Run in headed mode (visible):      npm run test:playwright:headed"
echo "4. Debug tests step by step:          npm run test:playwright:debug"
echo "5. Show test report:                  npm run test:playwright:report"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Run all Helios tests"
echo "2) Run with interactive UI"
echo "3) Run with visible browser"
echo "4) Debug tests"
echo "5) Show test report"
echo "6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🧪 Running all Helios tests..."
        npm run test:playwright:helios
        ;;
    2)
        echo "🎭 Starting interactive UI..."
        npm run test:playwright:ui
        ;;
    3)
        echo "👀 Running tests with visible browser..."
        npm run test:playwright:headed
        ;;
    4)
        echo "🐛 Starting debug mode..."
        npm run test:playwright:debug
        ;;
    5)
        echo "📊 Showing test report..."
        npm run test:playwright:report
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Running all Helios tests by default..."
        npm run test:playwright:helios
        ;;
esac

echo ""
echo "✅ Test execution completed!"
echo ""
echo "💡 Tips:"
echo "• Use 'npm run test:playwright:ui' for interactive testing"
echo "• Use 'npm run test:playwright:debug' to debug failing tests"
echo "• Check 'tests/playwright/README.md' for detailed documentation"
echo "• Test reports are available with 'npm run test:playwright:report'"