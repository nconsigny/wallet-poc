#!/bin/bash

# Direct Playwright runner - no checks, just try to run
echo "🎭 Direct Playwright Test Runner"
echo "==============================="

echo "Step 1: Trying to install Playwright..."
npm install @playwright/test --save-dev --force

echo "Step 2: Installing browsers..."
npx playwright install

echo "Step 3: Running tests..."
npx playwright test tests/playwright/helios

echo "✅ Done!"