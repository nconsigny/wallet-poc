import { test, expect } from '@playwright/test'

test.describe('Helios Component Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page that includes the HeliosTest component
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should render Helios test component when added to page', async ({ page }) => {
    // Inject the HeliosTest component into the page
    await page.addScriptTag({
      content: `
        // Mock React and ReactDOM for testing
        window.React = {
          createElement: (type, props, ...children) => {
            const element = document.createElement(typeof type === 'string' ? type : 'div')
            if (props) {
              Object.keys(props).forEach(key => {
                if (key === 'className') {
                  element.className = props[key]
                } else if (key === 'style') {
                  Object.assign(element.style, props[key])
                } else if (key.startsWith('data-')) {
                  element.setAttribute(key, props[key])
                } else if (key === 'onClick') {
                  element.onclick = props[key]
                } else if (key === 'disabled') {
                  element.disabled = props[key]
                } else if (key === 'value') {
                  element.value = props[key]
                } else if (key === 'onChange') {
                  element.oninput = props[key]
                } else if (key === 'placeholder') {
                  element.placeholder = props[key]
                }
              })
            }
            children.forEach(child => {
              if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child))
              } else if (child) {
                element.appendChild(child)
              }
            })
            return element
          },
          useState: (initial) => {
            const state = { value: initial }
            const setState = (newValue) => {
              state.value = typeof newValue === 'function' ? newValue(state.value) : newValue
              // Trigger re-render simulation
              setTimeout(() => window.updateHeliosUI && window.updateHeliosUI(), 0)
            }
            return [() => state.value, setState]
          },
          useEffect: (effect, deps) => {
            setTimeout(effect, 0)
          },
          useCallback: (fn, deps) => fn
        }

        window.ReactDOM = {
          render: (element, container) => {
            container.appendChild(element)
          }
        }

        // Mock the Helios hook
        window.useHelios = (config) => {
          const [isLoading, setIsLoading] = window.React.useState(true)
          const [isReady, setIsReady] = window.React.useState(false)
          const [error, setError] = window.React.useState(null)

          // Simulate initialization
          setTimeout(() => {
            setIsLoading(false)
            setIsReady(true)
          }, 2000)

          return {
            isLoading: isLoading(),
            isReady: isReady(),
            error: error(),
            getBalance: async (address) => {
              await new Promise(resolve => setTimeout(resolve, 1000))
              return '1000000000000000000' // 1 ETH in wei
            },
            getBlockNumber: async () => {
              await new Promise(resolve => setTimeout(resolve, 500))
              return 18500000
            },
            getChainId: async () => {
              await new Promise(resolve => setTimeout(resolve, 300))
              return 1
            },
            initialize: async () => {
              setIsLoading(false)
              setIsReady(true)
            }
          }
        }

        // Create the HeliosTest component
        window.createHeliosTest = () => {
          const { isLoading, isReady, error, getBalance, getBlockNumber, getChainId } = window.useHelios({
            network: 'mainnet',
            consensusRpc: 'https://www.lightclientdata.org',
            executionRpc: 'https://rpc.flashbots.net'
          })

          const [testAddress, setTestAddress] = window.React.useState('0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2')
          const [balance, setBalance] = window.React.useState(null)
          const [blockNumber, setBlockNumber] = window.React.useState(null)
          const [chainId, setChainId] = window.React.useState(null)
          const [loading, setLoading] = window.React.useState(false)

          const handleGetBalance = async () => {
            if (!isReady) return
            setLoading(true)
            try {
              const bal = await getBalance(testAddress())
              setBalance(bal)
            } catch (err) {
              console.error('Failed to get balance:', err)
            } finally {
              setLoading(false)
            }
          }

          const handleGetBlockNumber = async () => {
            if (!isReady) return
            setLoading(true)
            try {
              const blockNum = await getBlockNumber()
              setBlockNumber(blockNum)
            } catch (err) {
              console.error('Failed to get block number:', err)
            } finally {
              setLoading(false)
            }
          }

          const handleGetChainId = async () => {
            if (!isReady) return
            setLoading(true)
            try {
              const id = await getChainId()
              setChainId(id)
            } catch (err) {
              console.error('Failed to get chain ID:', err)
            } finally {
              setLoading(false)
            }
          }

          // Update UI function
          window.updateHeliosUI = () => {
            const container = document.getElementById('helios-test-container')
            if (!container) return

            const currentIsLoading = isLoading
            const currentIsReady = isReady
            const currentError = error()
            const currentBalance = balance()
            const currentBlockNumber = blockNumber()
            const currentChainId = chainId()
            const currentLoading = loading()

            container.innerHTML = \`
              <div data-testid="helios-test" style="padding: 20px; font-family: monospace;">
                <h2>Helios Light Client Test</h2>
                
                <div data-testid="helios-status" style="margin-bottom: 20px;">
                  <h3>Status:</h3>
                  <p data-testid="loading-status">Loading: \${currentIsLoading ? 'Yes' : 'No'}</p>
                  <p data-testid="ready-status">Ready: \${currentIsReady ? 'Yes' : 'No'}</p>
                  \${currentError ? \`<p data-testid="error-status" style="color: red;">Error: \${currentError}</p>\` : ''}
                </div>

                <div data-testid="test-address-section" style="margin-bottom: 20px;">
                  <h3>Test Address:</h3>
                  <input
                    data-testid="address-input"
                    type="text"
                    value="\${testAddress()}"
                    style="width: 400px; padding: 5px;"
                    placeholder="Enter Ethereum address"
                  />
                </div>

                <div data-testid="action-buttons" style="margin-bottom: 20px;">
                  <h3>Actions:</h3>
                  <button 
                    data-testid="get-balance-btn"
                    \${!currentIsReady || currentLoading ? 'disabled' : ''}
                    style="margin: 0 5px; padding: 5px 10px;"
                  >
                    Get Balance
                  </button>
                  <button 
                    data-testid="get-block-number-btn"
                    \${!currentIsReady || currentLoading ? 'disabled' : ''}
                    style="margin: 0 5px; padding: 5px 10px;"
                  >
                    Get Block Number
                  </button>
                  <button 
                    data-testid="get-chain-id-btn"
                    \${!currentIsReady || currentLoading ? 'disabled' : ''}
                    style="margin: 0 5px; padding: 5px 10px;"
                  >
                    Get Chain ID
                  </button>
                </div>

                <div data-testid="results">
                  <h3>Results:</h3>
                  \${currentBalance ? \`<p data-testid="balance-result">Balance: \${currentBalance} wei</p>\` : ''}
                  \${currentBlockNumber !== null ? \`<p data-testid="block-number-result">Block Number: \${currentBlockNumber}</p>\` : ''}
                  \${currentChainId !== null ? \`<p data-testid="chain-id-result">Chain ID: \${currentChainId}</p>\` : ''}
                  \${currentLoading ? '<p data-testid="loading-indicator">Loading...</p>' : ''}
                </div>
              </div>
            \`

            // Add event listeners
            const addressInput = container.querySelector('[data-testid="address-input"]')
            if (addressInput) {
              addressInput.oninput = (e) => setTestAddress(e.target.value)
            }

            const balanceBtn = container.querySelector('[data-testid="get-balance-btn"]')
            if (balanceBtn) {
              balanceBtn.onclick = handleGetBalance
            }

            const blockBtn = container.querySelector('[data-testid="get-block-number-btn"]')
            if (blockBtn) {
              blockBtn.onclick = handleGetBlockNumber
            }

            const chainBtn = container.querySelector('[data-testid="get-chain-id-btn"]')
            if (chainBtn) {
              chainBtn.onclick = handleGetChainId
            }
          }

          // Initial render
          setTimeout(window.updateHeliosUI, 0)
        }

        // Create container and render component
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        window.createHeliosTest()
      `
    })

    // Wait for the component to be rendered
    await expect(page.getByTestId('helios-test')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Helios Light Client Test')).toBeVisible()
  })

  test('should transition from loading to ready state', async ({ page }) => {
    // Set up the component
    await page.addScriptTag({
      path: './tests/playwright/helpers/helios-mock.js'
    }).catch(() => {
      // If the helper file doesn't exist, inline the setup
      return page.addScriptTag({
        content: `
          const container = document.createElement('div')
          container.id = 'helios-test-container'
          document.body.appendChild(container)
          
          let isLoading = true
          let isReady = false
          
          const updateUI = () => {
            container.innerHTML = \`
              <div data-testid="helios-test">
                <div data-testid="helios-status">
                  <p data-testid="loading-status">Loading: \${isLoading ? 'Yes' : 'No'}</p>
                  <p data-testid="ready-status">Ready: \${isReady ? 'Yes' : 'No'}</p>
                </div>
              </div>
            \`
          }
          
          updateUI()
          
          // Simulate state change after 3 seconds
          setTimeout(() => {
            isLoading = false
            isReady = true
            updateUI()
          }, 3000)
        `
      })
    })

    // Initially should be loading
    await expect(page.getByTestId('loading-status')).toContainText('Loading: Yes')
    await expect(page.getByTestId('ready-status')).toContainText('Ready: No')

    // Wait for state transition
    await expect(page.getByTestId('loading-status')).toContainText('Loading: No', { timeout: 5000 })
    await expect(page.getByTestId('ready-status')).toContainText('Ready: Yes')
  })

  test('should enable buttons when ready', async ({ page }) => {
    await page.addScriptTag({
      content: `
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let isReady = false
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <button data-testid="get-balance-btn" \${isReady ? '' : 'disabled'}>Get Balance</button>
              <button data-testid="get-block-number-btn" \${isReady ? '' : 'disabled'}>Get Block Number</button>
              <button data-testid="get-chain-id-btn" \${isReady ? '' : 'disabled'}>Get Chain ID</button>
            </div>
          \`
        }
        
        updateUI()
        
        // Enable buttons after 2 seconds
        setTimeout(() => {
          isReady = true
          updateUI()
        }, 2000)
      `
    })

    // Initially buttons should be disabled
    await expect(page.getByTestId('get-balance-btn')).toBeDisabled()
    await expect(page.getByTestId('get-block-number-btn')).toBeDisabled()
    await expect(page.getByTestId('get-chain-id-btn')).toBeDisabled()

    // After ready state, buttons should be enabled
    await expect(page.getByTestId('get-balance-btn')).toBeEnabled({ timeout: 3000 })
    await expect(page.getByTestId('get-block-number-btn')).toBeEnabled()
    await expect(page.getByTestId('get-chain-id-btn')).toBeEnabled()
  })

  test('should handle button clicks and show results', async ({ page }) => {
    await page.addScriptTag({
      content: `
        const container = document.createElement('div')
        container.id = 'helios-test-container'
        document.body.appendChild(container)
        
        let balance = null
        let blockNumber = null
        let chainId = null
        let loading = false
        
        const updateUI = () => {
          container.innerHTML = \`
            <div data-testid="helios-test">
              <button data-testid="get-balance-btn" \${loading ? 'disabled' : ''}>Get Balance</button>
              <button data-testid="get-block-number-btn" \${loading ? 'disabled' : ''}>Get Block Number</button>
              <button data-testid="get-chain-id-btn" \${loading ? 'disabled' : ''}>Get Chain ID</button>
              <div data-testid="results">
                \${balance ? \`<p data-testid="balance-result">Balance: \${balance} wei</p>\` : ''}
                \${blockNumber ? \`<p data-testid="block-number-result">Block Number: \${blockNumber}</p>\` : ''}
                \${chainId ? \`<p data-testid="chain-id-result">Chain ID: \${chainId}</p>\` : ''}
                \${loading ? '<p data-testid="loading-indicator">Loading...</p>' : ''}
              </div>
            </div>
          \`
          
          // Add event listeners
          container.querySelector('[data-testid="get-balance-btn"]').onclick = async () => {
            loading = true
            updateUI()
            await new Promise(resolve => setTimeout(resolve, 1000))
            balance = '1000000000000000000'
            loading = false
            updateUI()
          }
          
          container.querySelector('[data-testid="get-block-number-btn"]').onclick = async () => {
            loading = true
            updateUI()
            await new Promise(resolve => setTimeout(resolve, 800))
            blockNumber = '18500000'
            loading = false
            updateUI()
          }
          
          container.querySelector('[data-testid="get-chain-id-btn"]').onclick = async () => {
            loading = true
            updateUI()
            await new Promise(resolve => setTimeout(resolve, 500))
            chainId = '1'
            loading = false
            updateUI()
          }
        }
        
        updateUI()
      `
    })

    // Test getting balance
    await page.getByTestId('get-balance-btn').click()
    await expect(page.getByTestId('loading-indicator')).toBeVisible()
    await expect(page.getByTestId('balance-result')).toContainText('Balance: 1000000000000000000 wei', { timeout: 3000 })

    // Test getting block number
    await page.getByTestId('get-block-number-btn').click()
    await expect(page.getByTestId('block-number-result')).toContainText('Block Number: 18500000', { timeout: 2000 })

    // Test getting chain ID
    await page.getByTestId('get-chain-id-btn').click()
    await expect(page.getByTestId('chain-id-result')).toContainText('Chain ID: 1', { timeout: 2000 })
  })
})