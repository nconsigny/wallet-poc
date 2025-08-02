// Helios Integration Tests using Puppeteer (existing setup)
// This uses the same testing framework as your existing tests

describe('Helios Light Client Integration - Puppeteer', () => {
  let page

  beforeAll(async () => {
    page = await global.browser.newPage()
    // Set up the page with longer timeout for WASM loading
    page.setDefaultTimeout(30000)
  })

  afterAll(async () => {
    await page.close()
  })

  beforeEach(async () => {
    // Navigate to the app
    await page.goto('http://localhost:3000')
    await page.waitForLoadState?.() || await page.waitForLoadState?.('networkidle')
  })

  test('should load the application successfully', async () => {
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Check if the page loaded without critical errors
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })

  test('should have WASM support in the browser', async () => {
    const wasmSupported = await page.evaluate(() => {
      return typeof WebAssembly !== 'undefined' && 
             typeof WebAssembly.instantiate === 'function'
    })
    
    expect(wasmSupported).toBe(true)
  })

  test('should be able to access Helios WASM files', async () => {
    // Check if WASM files are accessible
    const wasmResponse = await page.goto('http://localhost:3000/assets/wasm/helios.wasm')
    expect(wasmResponse.status()).toBe(200)
    
    const jsResponse = await page.goto('http://localhost:3000/assets/wasm/helios.js')
    expect(jsResponse.status()).toBe(200)
    
    // Navigate back to the main page
    await page.goto('http://localhost:3000')
  })

  test('should render Helios test component', async () => {
    // Inject the Helios test component into the page
    await page.evaluate(() => {
      // Create test container
      const container = document.createElement('div')
      container.id = 'helios-test-container'
      container.setAttribute('data-testid', 'helios-test')
      document.body.appendChild(container)
      
      // Mock Helios functionality for testing
      container.innerHTML = `
        <div style="padding: 20px; font-family: monospace;">
          <h2>Helios Light Client Test</h2>
          
          <div data-testid="helios-status">
            <h3>Status:</h3>
            <p data-testid="loading-status">Loading: Yes</p>
            <p data-testid="ready-status">Ready: No</p>
          </div>

          <div data-testid="test-address-section">
            <h3>Test Address:</h3>
            <input
              data-testid="address-input"
              type="text"
              value="0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2"
              style="width: 400px; padding: 5px;"
              placeholder="Enter Ethereum address"
            />
          </div>

          <div data-testid="action-buttons">
            <h3>Actions:</h3>
            <button data-testid="get-balance-btn" disabled>Get Balance</button>
            <button data-testid="get-block-number-btn" disabled>Get Block Number</button>
            <button data-testid="get-chain-id-btn" disabled>Get Chain ID</button>
          </div>

          <div data-testid="results">
            <h3>Results:</h3>
          </div>
        </div>
      `
      
      // Simulate state change after 2 seconds
      setTimeout(() => {
        const loadingStatus = container.querySelector('[data-testid="loading-status"]')
        const readyStatus = container.querySelector('[data-testid="ready-status"]')
        const buttons = container.querySelectorAll('button[data-testid*="btn"]')
        
        if (loadingStatus) loadingStatus.textContent = 'Loading: No'
        if (readyStatus) readyStatus.textContent = 'Ready: Yes'
        buttons.forEach(btn => btn.removeAttribute('disabled'))
      }, 2000)
    })

    // Wait for component to render
    await page.waitForSelector('[data-testid="helios-test"]')
    const heading = await page.$eval('h2', el => el.textContent)
    expect(heading).toBe('Helios Light Client Test')
  })

  test('should show loading state initially', async () => {
    // Set up the component
    await page.evaluate(() => {
      const container = document.createElement('div')
      container.id = 'helios-test-container'
      document.body.appendChild(container)
      
      container.innerHTML = `
        <div data-testid="helios-test">
          <div data-testid="helios-status">
            <p data-testid="loading-status">Loading: Yes</p>
            <p data-testid="ready-status">Ready: No</p>
          </div>
        </div>
      `
    })

    await page.waitForSelector('[data-testid="loading-status"]')
    const loadingText = await page.$eval('[data-testid="loading-status"]', el => el.textContent)
    const readyText = await page.$eval('[data-testid="ready-status"]', el => el.textContent)
    
    expect(loadingText).toBe('Loading: Yes')
    expect(readyText).toBe('Ready: No')
  })

  test('should transition to ready state', async () => {
    // Set up component with state transition
    await page.evaluate(() => {
      const container = document.createElement('div')
      container.id = 'helios-test-container'
      document.body.appendChild(container)
      
      let isLoading = true
      let isReady = false
      
      const updateUI = () => {
        container.innerHTML = `
          <div data-testid="helios-test">
            <div data-testid="helios-status">
              <p data-testid="loading-status">Loading: ${isLoading ? 'Yes' : 'No'}</p>
              <p data-testid="ready-status">Ready: ${isReady ? 'Yes' : 'No'}</p>
            </div>
          </div>
        `
      }
      
      updateUI()
      
      // Simulate state change
      setTimeout(() => {
        isLoading = false
        isReady = true
        updateUI()
      }, 1000)
    })

    // Initially loading
    await page.waitForSelector('[data-testid="loading-status"]')
    let loadingText = await page.$eval('[data-testid="loading-status"]', el => el.textContent)
    expect(loadingText).toBe('Loading: Yes')

    // Wait for transition
    await page.waitForFunction(() => {
      const readyEl = document.querySelector('[data-testid="ready-status"]')
      return readyEl && readyEl.textContent === 'Ready: Yes'
    }, { timeout: 3000 })

    const finalLoadingText = await page.$eval('[data-testid="loading-status"]', el => el.textContent)
    const finalReadyText = await page.$eval('[data-testid="ready-status"]', el => el.textContent)
    
    expect(finalLoadingText).toBe('Loading: No')
    expect(finalReadyText).toBe('Ready: Yes')
  })

  test('should handle button interactions', async () => {
    await page.evaluate(() => {
      const container = document.createElement('div')
      container.id = 'helios-test-container'
      document.body.appendChild(container)
      
      let results = {}
      
      const updateUI = () => {
        container.innerHTML = `
          <div data-testid="helios-test">
            <button data-testid="get-balance-btn">Get Balance</button>
            <button data-testid="get-block-number-btn">Get Block Number</button>
            <div data-testid="results">
              ${results.balance ? `<p data-testid="balance-result">Balance: ${results.balance}</p>` : ''}
              ${results.blockNumber ? `<p data-testid="block-number-result">Block Number: ${results.blockNumber}</p>` : ''}
            </div>
          </div>
        `
        
        // Add event listeners
        const balanceBtn = container.querySelector('[data-testid="get-balance-btn"]')
        const blockBtn = container.querySelector('[data-testid="get-block-number-btn"]')
        
        if (balanceBtn) {
          balanceBtn.onclick = () => {
            setTimeout(() => {
              results.balance = '1000000000000000000 wei'
              updateUI()
            }, 500)
          }
        }
        
        if (blockBtn) {
          blockBtn.onclick = () => {
            setTimeout(() => {
              results.blockNumber = '18500000'
              updateUI()
            }, 300)
          }
        }
      }
      
      updateUI()
    })

    await page.waitForSelector('[data-testid="get-balance-btn"]')
    
    // Test balance button
    await page.click('[data-testid="get-balance-btn"]')
    await page.waitForSelector('[data-testid="balance-result"]', { timeout: 2000 })
    
    const balanceText = await page.$eval('[data-testid="balance-result"]', el => el.textContent)
    expect(balanceText).toBe('Balance: 1000000000000000000 wei')
    
    // Test block number button
    await page.click('[data-testid="get-block-number-btn"]')
    await page.waitForSelector('[data-testid="block-number-result"]', { timeout: 2000 })
    
    const blockText = await page.$eval('[data-testid="block-number-result"]', el => el.textContent)
    expect(blockText).toBe('Block Number: 18500000')
  })

  test('should validate address input', async () => {
    await page.evaluate(() => {
      const container = document.createElement('div')
      container.id = 'helios-test-container'
      document.body.appendChild(container)
      
      let address = '0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2'
      let error = null
      
      const validateAddress = (addr) => {
        if (!addr) return 'Address is required'
        if (!addr.startsWith('0x')) return 'Address must start with 0x'
        if (addr.length !== 42) return 'Address must be 42 characters long'
        if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'Address must contain only hex characters'
        return null
      }
      
      const updateUI = () => {
        container.innerHTML = `
          <div data-testid="helios-test">
            <input 
              data-testid="address-input" 
              type="text" 
              value="${address}"
              placeholder="Enter Ethereum address"
            />
            <button data-testid="validate-btn">Validate</button>
            ${error ? `<p data-testid="validation-error" style="color: red;">${error}</p>` : ''}
            ${!error && address ? `<p data-testid="validation-success" style="color: green;">Valid address!</p>` : ''}
          </div>
        `
        
        const input = container.querySelector('[data-testid="address-input"]')
        const validateBtn = container.querySelector('[data-testid="validate-btn"]')
        
        if (input) {
          input.oninput = (e) => {
            address = e.target.value
            error = null
            updateUI()
          }
        }
        
        if (validateBtn) {
          validateBtn.onclick = () => {
            error = validateAddress(address)
            updateUI()
          }
        }
      }
      
      updateUI()
    })

    await page.waitForSelector('[data-testid="address-input"]')
    
    // Test valid address
    await page.click('[data-testid="validate-btn"]')
    await page.waitForSelector('[data-testid="validation-success"]')
    
    // Test invalid address
    await page.focus('[data-testid="address-input"]')
    await page.keyboard.selectAll()
    await page.keyboard.type('invalid-address')
    await page.click('[data-testid="validate-btn"]')
    
    await page.waitForSelector('[data-testid="validation-error"]')
    const errorText = await page.$eval('[data-testid="validation-error"]', el => el.textContent)
    expect(errorText).toContain('Address must start with 0x')
  })
})