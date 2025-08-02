import { heliosWasmLoader } from './HeliosWasmLoader'
import type { EthereumClient } from '../../../web/assets/wasm/helios'

export interface HeliosConfig {
  consensusRpc?: string
  executionRpc?: string
  verifiableApi?: string
  network?: 'mainnet' | 'sepolia' | 'holesky'
  checkpoint?: string
  dbType?: string
}

export class HeliosProvider {
  private client: EthereumClient | null = null
  private config: HeliosConfig
  private isInitialized = false

  constructor(config: HeliosConfig = {}) {
    this.config = {
      network: 'mainnet',
      consensusRpc: 'https://www.lightclientdata.org',
      executionRpc: 'https://rpc.flashbots.net',
      verifiableApi: undefined,
      checkpoint: undefined,
      dbType: 'memory',
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Load the WASM module
      const EthereumClientClass = await heliosWasmLoader.loadWasm()

      // Create a new EthereumClient instance with proper parameters
      this.client = new EthereumClientClass(
        this.config.executionRpc || null,
        this.config.verifiableApi || null,
        this.config.consensusRpc || null,
        this.config.network || 'mainnet',
        this.config.checkpoint || null,
        this.config.dbType || 'memory'
      )

      // Wait for the client to sync
      await this.client.wait_synced()
      this.isInitialized = true
      console.log('Helios light client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Helios provider:', error)
      throw error
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Helios provider not initialized')
    }

    try {
      return await this.client.get_balance(address, 'latest')
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }

  async getTransactionCount(address: string): Promise<number> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Helios provider not initialized')
    }

    try {
      return await this.client.get_transaction_count(address, 'latest')
    } catch (error) {
      console.error('Failed to get transaction count:', error)
      throw error
    }
  }

  async call(to: string, data: string): Promise<string> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Helios provider not initialized')
    }

    try {
      return await this.client.call({
        to,
        data
      }, 'latest')
    } catch (error) {
      console.error('Failed to make call:', error)
      throw error
    }
  }

  async getBlockNumber(): Promise<number> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Helios provider not initialized')
    }

    try {
      return await this.client.get_block_number()
    } catch (error) {
      console.error('Failed to get block number:', error)
      throw error
    }
  }

  async getChainId(): Promise<number> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Helios provider not initialized')
    }

    try {
      return await this.client.chain_id()
    } catch (error) {
      console.error('Failed to get chain ID:', error)
      throw error
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.client !== null
  }

  getClient(): EthereumClient | null {
    return this.client
  }
}

let heliosProviderInstance: HeliosProvider | null = null

export const getHeliosProvider = (config?: HeliosConfig): HeliosProvider => {
  if (!heliosProviderInstance) {
    heliosProviderInstance = new HeliosProvider(config)
  }
  return heliosProviderInstance
}