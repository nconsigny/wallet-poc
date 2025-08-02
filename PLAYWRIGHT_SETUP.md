# Quick Playwright Setup Guide

Since there are dependency conflicts with the main npm install, here are alternative approaches to get Playwright testing working:

## Option 1: Use the Simple Script (Recommended)

```bash
./test-helios-simple.sh
```

This script will:
1. Install only @playwright/test (avoiding other dependency conflicts)
2. Install Playwright browsers
3. Run the Helios tests

## Option 2: Manual Installation

If the script doesn't work, try these manual steps:

### Step 1: Install Playwright only
```bash
npm install @playwright/test --save-dev --force
```

### Step 2: Install browsers
```bash
npx playwright install
```

### Step 3: Run tests
```bash
npx playwright test tests/playwright/helios
```

## Option 3: Global Playwright Installation

If local installation keeps failing:

### Step 1: Install Playwright globally
```bash
npm install -g @playwright/test
```

### Step 2: Install browsers
```bash
playwright install
```

### Step 3: Run tests from project directory
```bash
playwright test tests/playwright/helios
```

## Option 4: Use yarn instead of npm

```bash
yarn add @playwright/test --dev
npx playwright install
npx playwright test tests/playwright/helios
```

## Available Test Commands

Once Playwright is set up, you can use:

```bash
# Run all Helios tests
npx playwright test tests/playwright/helios

# Run with visible browser
npx playwright test tests/playwright/helios --headed

# Interactive UI mode
npx playwright test tests/playwright/helios --ui

# Debug mode (step by step)
npx playwright test tests/playwright/helios --debug

# Generate HTML report
npx playwright test tests/playwright/helios --reporter=html
```

## Troubleshooting

### If you get "playwright command not found":
```bash
# Check if it's installed locally
./node_modules/.bin/playwright --version

# Or install globally
npm install -g @playwright/test
```

### If browsers aren't installing:
```bash
# Try with sudo (Linux/Mac)
sudo npx playwright install

# Or manually download
npx playwright install chromium firefox webkit
```

### If tests fail to find the app:
1. Make sure your development server is running on localhost:3000
2. Update the baseURL in playwright.config.ts if needed
3. Check that the web build is accessible

## What the Tests Do

The Playwright tests will:

1. **Integration Tests**: Verify WASM loading and basic functionality
2. **Component Tests**: Test UI interactions and state management  
3. **Error Handling**: Test various failure scenarios
4. **Validation**: Test input validation and error recovery

The tests use mocked Helios functionality so they don't require:
- Real network connections
- Actual WASM compilation
- External RPC endpoints
- Complex React setup

This makes them fast and reliable for continuous testing.