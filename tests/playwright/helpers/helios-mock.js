// Helios Mock Helper for Playwright Tests
// This file provides mock implementations for testing Helios integration

// Mock React hooks for testing
window.React = {
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

// Mock Helios hook
window.useHelios = (config) => {
  const [isLoading, setIsLoading] = window.React.useState(true)
  const [isReady, setIsReady] = window.React.useState(false)
  const [error, setError] = window.React.useState(null)

  // Simulate initialization with realistic timing
  setTimeout(() => {
    setIsLoading(false)
    setIsReady(true)
  }, 3000) // 3 second initialization

  return {
    isLoading: isLoading(),
    isReady: isReady(),
    error: error(),
    getBalance: async (address) => {
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network delay
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid address')
      }
      return '1000000000000000000' // 1 ETH in wei
    },
    getBlockNumber: async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return Math.floor(18500000 + Math.random() * 1000) // Realistic block number
    },
    getChainId: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return 1 // Mainnet
    },
    getTransactionCount: async (address) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return Math.floor(Math.random() * 100) // Random nonce
    },
    call: async (to, data) => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      return '0x0000000000000000000000000000000000000000000000000000000000000001'
    },
    initialize: async () => {
      setIsLoading(false)
      setIsReady(true)
    }
  }
}

// Utility function to create test container
window.createHeliosTestContainer = () => {
  const container = document.createElement('div')
  container.id = 'helios-test-container'
  document.body.appendChild(container)
  return container
}

// Utility function to simulate WASM loading
window.simulateWasmLoading = async () => {
  // Simulate WASM module loading
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    wasmLoaded: true,
    moduleAvailable: typeof WebAssembly !== 'undefined',
    features: {
      asyncWebAssembly: true,
      topLevelAwait: true
    }
  }
}

// Error simulation utility
window.simulateHeliosError = (errorMessage = 'Connection failed') => {
  window.useHelios = (config) => {
    const [isLoading, setIsLoading] = window.React.useState(true)
    const [isReady, setIsReady] = window.React.useState(false)
    const [error, setError] = window.React.useState(null)

    setTimeout(() => {
      setIsLoading(false)
      setError(errorMessage)
    }, 2000)

    return {
      isLoading: isLoading(),
      isReady: isReady(),
      error: error(),
      getBalance: async () => { throw new Error(errorMessage) },
      getBlockNumber: async () => { throw new Error(errorMessage) },
      getChainId: async () => { throw new Error(errorMessage) },
      initialize: async () => { throw new Error(errorMessage) }
    }
  }
}

console.log('Helios mock helper loaded successfully')