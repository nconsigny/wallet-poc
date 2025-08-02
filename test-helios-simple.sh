#!/bin/bash

# Simple Helios Playwright Test Runner (without dependency conflicts)
# This script focuses only on Playwright testing

set -e

echo "🎭 Simple Helios Playwright Test Runner"
echo "======================================"

# Check if Playwright is available
echo "🔍 Checking if Playwright is installed..."
if command -v playwright > /dev/null 2>&1; then
    echo "✅ Playwright found globally"
    PLAYWRIGHT_CMD="playwright"
elif npx playwright --version > /dev/null 2>&1; then
    echo "✅ Playwright found locally via npx"
    PLAYWRIGHT_CMD="npx playwright"
elif [ -f "./node_modules/.bin/playwright" ]; then
    echo "✅ Playwright found in node_modules"
    PLAYWRIGHT_CMD="./node_modules/.bin/playwright"
else
    echo "📦 Playwright not found. Installing Playwright only..."
    
    # Try to install just Playwright with timeout
    timeout 60 npm install @playwright/test --save-dev --legacy-peer-deps || {
        echo "⚠️  Npm install timed out or failed, trying with --force flag..."
        timeout 60 npm install @playwright/test --save-dev --force || {
            echo "❌ Failed to install Playwright via npm"
            echo "💡 Trying alternative: installing globally..."
            npm install -g @playwright/test || {
                echo "❌ All installation methods failed"
                echo "💡 Please try manually:"
                echo "   npm install @playwright/test --save-dev --force"
                echo "   OR npm install -g @playwright/test"
                exit 1
            }
            PLAYWRIGHT_CMD="playwright"
        }
    }
    
    # Set command after successful local install
    if [ -z "$PLAYWRIGHT_CMD" ]; then
        PLAYWRIGHT_CMD="npx playwright"
    fi
    echo "✅ Playwright installed successfully"
fi

echo "🎭 Installing Playwright browsers..."
if $PLAYWRIGHT_CMD install; then
    echo "✅ Playwright browsers installed successfully"
else
    echo "❌ Failed to install Playwright browsers"
    echo "💡 Try running '$PLAYWRIGHT_CMD install' manually"
    exit 1
fi

echo ""
echo "🔧 Choose what to run:"
echo "1) Run Helios tests (headless)"
echo "2) Run with visible browser"
echo "3) Run with UI mode (interactive)"
echo "4) Debug mode"
echo "5) Just check Playwright setup"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🧪 Running Helios tests..."
        $PLAYWRIGHT_CMD test tests/playwright/helios
        ;;
    2)
        echo "👀 Running tests with visible browser..."
        $PLAYWRIGHT_CMD test tests/playwright/helios --headed
        ;;
    3)
        echo "🎭 Starting interactive UI..."
        $PLAYWRIGHT_CMD test tests/playwright/helios --ui
        ;;
    4)
        echo "🐛 Starting debug mode..."
        $PLAYWRIGHT_CMD test tests/playwright/helios --debug
        ;;
    5)
        echo "🔍 Checking Playwright setup..."
        $PLAYWRIGHT_CMD --version
        echo "Available browsers:"
        ls ~/.cache/ms-playwright/ 2>/dev/null || echo "No browsers found in cache"
        echo "✅ Playwright is ready!"
        ;;
    *)
        echo "❌ Invalid choice. Running headless tests by default..."
        $PLAYWRIGHT_CMD test tests/playwright/helios
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "💡 Available commands for future use:"
echo "• npx playwright test tests/playwright/helios"
echo "• npx playwright test tests/playwright/helios --ui"
echo "• npx playwright test tests/playwright/helios --headed"
echo "• npx playwright test tests/playwright/helios --debug"