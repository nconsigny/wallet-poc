# Playwright Tests for Helios Integration

This directory contains Playwright end-to-end tests for the Helios light client integration in the Ambire wallet.

## Overview

The Playwright tests provide comprehensive coverage of the Helios light client integration, including:

- Basic component rendering and functionality
- State management and transitions
- Error handling and recovery
- User interactions and form validation
- Performance and timeout scenarios

## Test Structure

```
tests/playwright/
├── README.md                           # This file
├── helios/                             # Helios-specific tests
│   ├── helios-integration.spec.ts      # Basic integration tests
│   ├── helios-component.spec.ts        # Component interaction tests
│   └── helios-error-handling.spec.ts   # Error handling tests
└── helpers/                            # Test utilities
    └── helios-mock.js                  # Mock implementations for testing
```

## Available Test Scripts

Run these commands from the project root:

### Basic Test Execution
```bash
# Run all Playwright tests
npm run test:playwright

# Run only Helios tests
npm run test:playwright:helios

# Run tests with UI mode (interactive)
npm run test:playwright:ui

# Run tests in headed mode (visible browser)
npm run test:playwright:headed
```

### Debugging
```bash
# Debug tests step by step
npm run test:playwright:debug

# Show test report
npm run test:playwright:report
```

## Test Categories

### 1. Integration Tests (`helios-integration.spec.ts`)

Basic integration tests that verify:
- WASM module loading
- Component initialization
- Service availability
- WebAssembly support

**Key test cases:**
- `should load Helios WASM module successfully`
- `should initialize Helios client`
- `should show loading state initially`
- `should handle address input changes`
- `should have buttons disabled when not ready`

### 2. Component Tests (`helios-component.spec.ts`)

Interactive component tests that cover:
- State transitions (loading → ready)
- Button interactions
- Result display
- User input handling

**Key test cases:**
- `should render Helios test component when added to page`
- `should transition from loading to ready state`
- `should enable buttons when ready`
- `should handle button clicks and show results`

### 3. Error Handling Tests (`helios-error-handling.spec.ts`)

Comprehensive error scenarios:
- WASM loading failures
- Network connection errors
- Invalid input validation
- API call failures
- Timeout handling

**Key test cases:**
- `should handle WASM loading errors gracefully`
- `should handle network connection errors`
- `should handle invalid address input`
- `should handle API call failures`
- `should handle timeout scenarios`

## Mock System

The tests use a sophisticated mock system (`helpers/helios-mock.js`) that simulates:

- React hook behavior
- Helios service responses
- Network delays and errors
- WebAssembly loading
- State management

This allows testing without requiring:
- Actual network connections
- Real WASM compilation
- External RPC endpoints
- Complex React setup

## Configuration

The tests are configured in `playwright.config.ts` with:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Web Server**: Automatically starts the development server

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Development Workflow

1. **Start development server** (done automatically):
```bash
npm run web:webkit
```

2. **Run specific test suite**:
```bash
npm run test:playwright:helios
```

3. **Debug failing tests**:
```bash
npm run test:playwright:debug
```

4. **View test results**:
```bash
npm run test:playwright:report
```

## Test Data

The tests use realistic test data:

- **Test Address**: `0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2`
- **Mock Balance**: `1000000000000000000` wei (1 ETH)
- **Mock Block Number**: `~18500000` (realistic mainnet block)
- **Mock Chain ID**: `1` (Ethereum mainnet)

## Best Practices

### Writing New Tests

1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** in describe blocks
3. **Use proper data-testid attributes** for element selection
4. **Include timeout specifications** for async operations
5. **Clean up after tests** to avoid side effects

### Debugging Tests

1. **Use `test.only()`** to focus on specific tests
2. **Add `await page.pause()`** to inspect state during test
3. **Check browser console** for JavaScript errors
4. **Use `--headed` flag** to see tests run visually

### Performance Considerations

1. **Tests run in parallel** by default
2. **Use proper timeouts** for network operations
3. **Mock heavy operations** to speed up tests
4. **Group similar tests** to share setup costs

## Continuous Integration

The tests are configured to run in CI with:
- **Single worker** to avoid resource conflicts
- **2 retries** for flaky tests
- **HTML reporter** for detailed results
- **Automatic browser installation**

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeout in test or config
2. **Element not found**: Check data-testid attributes
3. **State not updating**: Ensure proper async/await usage
4. **WASM loading fails**: Check WebAssembly support

### Debugging Commands

```bash
# Verbose output
npm run test:playwright -- --reporter=line

# Run specific test file
npm run test:playwright tests/playwright/helios/helios-integration.spec.ts

# Run with specific browser
npm run test:playwright -- --project=chromium

# Generate trace files
npm run test:playwright -- --trace=on
```

## Future Enhancements

Potential improvements for the test suite:

1. **Visual regression testing** with screenshots
2. **Performance benchmarking** for WASM loading
3. **Cross-browser compatibility** testing
4. **Mobile viewport** testing
5. **Accessibility testing** integration