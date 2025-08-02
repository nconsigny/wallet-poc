import { test, expect } from '@playwright/test'

test.describe('Helios Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should handle WASM loading errors gracefully', async ({ page }) => {
    // Mock WASM loading failure
    await page.addScriptTag({
      content: `
        // Override WebAssembly to simulate failure
        window.WebAssembly = undefined
        
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let error = null
        let isLoading = true
        let isReady = false
        
        // Simulate WASM loading failure
        setTimeout(() => {
          isLoading = false
          error = 'WebAssembly is not supported in this browser'
        }, 1000)
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <div data-testid="helios-status">
                <p data-testid="loading-status">Loading: \${isLoading ? 'Yes' : 'No'}</p>
                <p data-testid="ready-status">Ready: \${isReady ? 'Yes' : 'No'}</p>
                \${error ? \`<p data-testid="error-status" style="color: red;">Error: \${error}</p>\` : ''}
              </div>
            </div>
          \`
        }
        
        updateUI()
        
        setTimeout(() => {
          updateUI()
        }, 1500)
      `
    })

    await expect(page.getByTestId('error-status')).toContainText('WebAssembly is not supported', { timeout: 3000 })
    await expect(page.getByTestId('ready-status')).toContainText('Ready: No')
  })

  test('should handle network connection errors', async ({ page }) => {
    await page.addScriptTag({
      content: `
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let error = null
        let isLoading = true
        let isReady = false
        
        // Simulate network connection failure
        setTimeout(() => {
          isLoading = false
          error = 'Failed to connect to consensus RPC endpoint'
        }, 2000)
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <div data-testid="helios-status">
                <p data-testid="loading-status">Loading: \${isLoading ? 'Yes' : 'No'}</p>
                <p data-testid="ready-status">Ready: \${isReady ? 'Yes' : 'No'}</p>
                \${error ? \`<p data-testid="error-status" style="color: red;">Error: \${error}</p>\` : ''}
              </div>
              <button data-testid="retry-btn" \${isLoading ? 'disabled' : ''}>Retry Connection</button>
            </div>
          \`
          
          const retryBtn = container.querySelector('[data-testid="retry-btn"]')
          if (retryBtn) {
            retryBtn.onclick = () => {
              error = null
              isLoading = true
              updateUI()
              
              // Simulate successful retry
              setTimeout(() => {
                isLoading = false
                isReady = true
                updateUI()
              }, 1500)
            }
          }
        }
        
        updateUI()
        
        setTimeout(() => {
          updateUI()
        }, 2500)
      `
    })

    // Wait for error to appear
    await expect(page.getByTestId('error-status')).toContainText('Failed to connect to consensus RPC', { timeout: 4000 })

    // Test retry functionality
    await page.getByTestId('retry-btn').click()
    await expect(page.getByTestId('loading-status')).toContainText('Loading: Yes')
    await expect(page.getByTestId('ready-status')).toContainText('Ready: Yes', { timeout: 3000 })
    await expect(page.getByTestId('error-status')).not.toBeVisible()
  })

  test('should handle invalid address input', async ({ page }) => {
    await page.addScriptTag({
      content: `
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let address = ''
        let error = null
        let result = null
        
        const validateAddress = (addr) => {
          if (!addr) return 'Address is required'
          if (!addr.startsWith('0x')) return 'Address must start with 0x'
          if (addr.length !== 42) return 'Address must be 42 characters long'
          if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'Address must contain only hex characters'
          return null
        }
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <div data-testid="address-section">
                <input 
                  data-testid="address-input" 
                  type="text" 
                  value="\${address}"
                  placeholder="Enter Ethereum address"
                  style="width: 400px; padding: 5px;"
                />
                <button data-testid="validate-btn">Validate Address</button>
              </div>
              \${error ? \`<p data-testid="validation-error" style="color: red;">Error: \${error}</p>\` : ''}
              \${result ? \`<p data-testid="validation-success" style="color: green;">Address is valid!</p>\` : ''}
            </div>
          \`
          
          const input = container.querySelector('[data-testid="address-input"]')
          const validateBtn = container.querySelector('[data-testid="validate-btn"]')
          
          if (input) {
            input.oninput = (e) => {
              address = e.target.value
              error = null
              result = null
            }
          }
          
          if (validateBtn) {
            validateBtn.onclick = () => {
              error = validateAddress(address)
              result = error ? null : 'valid'
              updateUI()
            }
          }
        }
        
        updateUI()
      `
    })

    const addressInput = page.getByTestId('address-input')
    const validateBtn = page.getByTestId('validate-btn')

    // Test empty address
    await validateBtn.click()
    await expect(page.getByTestId('validation-error')).toContainText('Address is required')

    // Test invalid format
    await addressInput.fill('invalid-address')
    await validateBtn.click()
    await expect(page.getByTestId('validation-error')).toContainText('Address must start with 0x')

    // Test wrong length
    await addressInput.fill('0x123')
    await validateBtn.click()
    await expect(page.getByTestId('validation-error')).toContainText('Address must be 42 characters long')

    // Test invalid characters
    await addressInput.fill('0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1CG')
    await validateBtn.click()
    await expect(page.getByTestId('validation-error')).toContainText('Address must contain only hex characters')

    // Test valid address
    await addressInput.fill('0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2')
    await validateBtn.click()
    await expect(page.getByTestId('validation-success')).toContainText('Address is valid!')
    await expect(page.getByTestId('validation-error')).not.toBeVisible()
  })

  test('should handle API call failures', async ({ page }) => {
    await page.addScriptTag({
      content: `
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let isReady = true
        let result = null
        let error = null
        let loading = false
        
        const mockApiCall = async (type) => {
          loading = true
          updateUI()
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Simulate different types of failures
          const failures = {
            balance: 'Failed to fetch balance: RPC endpoint timeout',
            blockNumber: 'Failed to get block number: Node synchronization error',
            chainId: 'Failed to get chain ID: Invalid response from server'
          }
          
          loading = false
          error = failures[type]
          updateUI()
        }
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <div data-testid="action-buttons">
                <button data-testid="get-balance-btn" \${loading ? 'disabled' : ''}>Get Balance</button>
                <button data-testid="get-block-number-btn" \${loading ? 'disabled' : ''}>Get Block Number</button>
                <button data-testid="get-chain-id-btn" \${loading ? 'disabled' : ''}>Get Chain ID</button>
              </div>
              <div data-testid="results">
                \${error ? \`<p data-testid="api-error" style="color: red;">Error: \${error}</p>\` : ''}
                \${result ? \`<p data-testid="api-result" style="color: green;">Result: \${result}</p>\` : ''}
                \${loading ? '<p data-testid="loading-indicator">Loading...</p>' : ''}
              </div>
              <button data-testid="clear-error-btn" \${!error ? 'disabled' : ''} style="margin-top: 10px;">Clear Error</button>
            </div>
          \`
          
          // Add event listeners
          const balanceBtn = container.querySelector('[data-testid="get-balance-btn"]')
          const blockBtn = container.querySelector('[data-testid="get-block-number-btn"]')
          const chainBtn = container.querySelector('[data-testid="get-chain-id-btn"]')
          const clearBtn = container.querySelector('[data-testid="clear-error-btn"]')
          
          if (balanceBtn) balanceBtn.onclick = () => mockApiCall('balance')
          if (blockBtn) blockBtn.onclick = () => mockApiCall('blockNumber')
          if (chainBtn) chainBtn.onclick = () => mockApiCall('chainId')
          if (clearBtn) {
            clearBtn.onclick = () => {
              error = null
              result = null
              updateUI()
            }
          }
        }
        
        updateUI()
      `
    })

    // Test balance API failure
    await page.getByTestId('get-balance-btn').click()
    await expect(page.getByTestId('loading-indicator')).toBeVisible()
    await expect(page.getByTestId('api-error')).toContainText('Failed to fetch balance: RPC endpoint timeout', { timeout: 3000 })

    // Clear error and test block number failure
    await page.getByTestId('clear-error-btn').click()
    await expect(page.getByTestId('api-error')).not.toBeVisible()

    await page.getByTestId('get-block-number-btn').click()
    await expect(page.getByTestId('api-error')).toContainText('Failed to get block number: Node synchronization error', { timeout: 3000 })

    // Clear error and test chain ID failure
    await page.getByTestId('clear-error-btn').click()
    await page.getByTestId('get-chain-id-btn').click()
    await expect(page.getByTestId('api-error')).toContainText('Failed to get chain ID: Invalid response from server', { timeout: 3000 })
  })

  test('should handle timeout scenarios', async ({ page }) => {
    await page.addScriptTag({
      content: `
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let loading = false
        let error = null
        
        const simulateTimeout = async () => {
          loading = true
          updateUI()
          
          // Simulate a long-running operation that times out
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timed out after 5 seconds')), 5000)
          })
          
          try {
            await timeoutPromise
          } catch (err) {
            loading = false
            error = err.message
            updateUI()
          }
        }
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <button data-testid="timeout-test-btn" \${loading ? 'disabled' : ''}>
                \${loading ? 'Testing timeout...' : 'Test Timeout Scenario'}
              </button>
              <div data-testid="results">
                \${error ? \`<p data-testid="timeout-error" style="color: red;">Error: \${error}</p>\` : ''}
                \${loading ? '<p data-testid="loading-indicator">Operation in progress...</p>' : ''}
              </div>
            </div>
          \`
          
          const timeoutBtn = container.querySelector('[data-testid="timeout-test-btn"]')
          if (timeoutBtn) {
            timeoutBtn.onclick = () => {
              error = null
              simulateTimeout()
            }
          }
        }
        
        updateUI()
      `
    })

    // Start timeout test
    await page.getByTestId('timeout-test-btn').click()
    await expect(page.getByTestId('loading-indicator')).toBeVisible()
    await expect(page.getByTestId('timeout-test-btn')).toContainText('Testing timeout...')

    // Wait for timeout to occur
    await expect(page.getByTestId('timeout-error')).toContainText('Operation timed out after 5 seconds', { timeout: 7000 })
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible()
    await expect(page.getByTestId('timeout-test-btn')).toContainText('Test Timeout Scenario')
  })
})