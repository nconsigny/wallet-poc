// Real Helios Integration for Browser Extension Environment
export class HeliosRealIntegration {
  private wasmModule: any = null
  private ethereumClient: any = null
  private isInitialized = false
  private isLoading = false

  async loadWasm() {
    if (this.wasmModule) {
      return this.wasmModule
    }

    try {
      console.log('🔄 Loading Helios WASM module in extension...')
      
      // In extension environment, we need to load WASM differently
      // Try to import the WASM module directly
      const wasmUrl = chrome.runtime.getURL('assets/wasm/helios.js')
      
      // Import the ES6 module
      const wasmModule = await import(wasmUrl)
      
      console.log('🔧 WASM module imported, initializing...')
      
      // Initialize the WASM with the binary
      const wasmInit = wasmModule.default
      const wasmBinaryUrl = chrome.runtime.getURL('assets/wasm/helios.wasm')
      await wasmInit(wasmBinaryUrl)
      
      console.log('🧩 WASM binary loaded, checking exports...')
      
      // Check if we have the expected exports
      if (!wasmModule.EthereumClient) {
        const exports = Object.keys(wasmModule)
        console.log('Available exports:', exports)
        throw new Error('EthereumClient not found in WASM exports')
      }
      
      this.wasmModule = wasmModule
      console.log('✅ Helios WASM module loaded successfully in extension')
      
      return this.wasmModule
      
    } catch (error) {
      console.error('❌ Failed to load Helios WASM in extension:', error)
      throw error
    }
  }

  async initialize(config: any = {}) {
    if (this.isInitialized) {
      return
    }

    if (this.isLoading) {
      throw new Error('Helios is already initializing')
    }

    this.isLoading = true

    try {
      console.log('🚀 Initializing Helios client in extension...')
      
      // Load WASM module first
      await this.loadWasm()
      
      const defaultConfig = {
        executionRpc: 'https://rpc.flashbots.net',
        consensusRpc: 'https://www.lightclientdata.org',
        network: 'mainnet',
        checkpoint: null,
        verifiableApi: null,
        dbType: 'memory'
      }
      
      const finalConfig = { ...defaultConfig, ...config }
      console.log('🔧 Using config:', finalConfig)
      
      // Create EthereumClient instance
      if (!this.wasmModule.EthereumClient) {
        throw new Error('EthereumClient not found in WASM module')
      }
      
      this.ethereumClient = new this.wasmModule.EthereumClient(
        finalConfig.executionRpc,
        finalConfig.verifiableApi,
        finalConfig.consensusRpc,
        finalConfig.network,
        finalConfig.checkpoint,
        finalConfig.dbType
      )
      
      console.log('⏳ Waiting for client to sync...')
      
      // Wait for sync with timeout
      const syncTimeout = 45000 // 45 seconds
      const syncPromise = this.ethereumClient.wait_synced()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync timeout after 45 seconds')), syncTimeout)
      })
      
      await Promise.race([syncPromise, timeoutPromise])
      
      this.isInitialized = true
      this.isLoading = false
      
      console.log('✅ Helios client initialized and synced in extension!')
      
    } catch (error) {
      this.isLoading = false
      console.error('❌ Failed to initialize Helios in extension:', error)
      throw error
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.isInitialized || !this.ethereumClient) {
      throw new Error('Helios client not initialized')
    }

    try {
      console.log(`🔍 Getting balance for ${address}...`)
      const balance = await this.ethereumClient.get_balance(address, 'latest')
      console.log(`✅ Balance retrieved: ${balance} wei`)
      return balance
    } catch (error) {
      console.error('❌ Failed to get balance:', error)
      throw error
    }
  }

  async getBlockNumber(): Promise<string> {
    if (!this.isInitialized || !this.ethereumClient) {
      throw new Error('Helios client not initialized')
    }

    try {
      console.log('🔍 Getting latest block number...')
      const blockNumber = await this.ethereumClient.get_block_number()
      console.log(`✅ Block number: ${blockNumber}`)
      return blockNumber.toString()
    } catch (error) {
      console.error('❌ Failed to get block number:', error)
      throw error
    }
  }

  async getChainId(): Promise<number> {
    if (!this.isInitialized || !this.ethereumClient) {
      throw new Error('Helios client not initialized')
    }

    try {
      console.log('🔍 Getting chain ID...')
      const chainId = await this.ethereumClient.chain_id()
      console.log(`✅ Chain ID: ${chainId}`)
      return Number(chainId)
    } catch (error) {
      console.error('❌ Failed to get chain ID:', error)
      throw error
    }
  }

  async getTransactionCount(address: string): Promise<string> {
    if (!this.isInitialized || !this.ethereumClient) {
      throw new Error('Helios client not initialized')
    }

    try {
      console.log(`🔍 Getting transaction count for ${address}...`)
      const count = await this.ethereumClient.get_transaction_count(address, 'latest')
      console.log(`✅ Transaction count: ${count}`)
      return count.toString()
    } catch (error) {
      console.error('❌ Failed to get transaction count:', error)
      throw error
    }
  }

  async call(to: string, data: string): Promise<string> {
    if (!this.isInitialized || !this.ethereumClient) {
      throw new Error('Helios client not initialized')
    }

    try {
      console.log(`🔍 Making call to ${to}...`)
      const result = await this.ethereumClient.call({ to, data }, 'latest')
      console.log(`✅ Call result: ${result}`)
      return result
    } catch (error) {
      console.error('❌ Failed to make call:', error)
      throw error
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.ethereumClient !== null
  }

  getStatus() {
    return {
      isLoading: this.isLoading,
      isInitialized: this.isInitialized,
      isReady: this.isReady(),
      hasWasm: this.wasmModule !== null,
      hasClient: this.ethereumClient !== null
    }
  }
}