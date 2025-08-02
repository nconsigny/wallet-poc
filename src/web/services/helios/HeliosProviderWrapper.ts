import { HeliosRealIntegration } from './HeliosRealIntegration'

export interface RpcProvider {
  send(method: string, params: any[]): Promise<any>
  getTransactionReceipt(txHash: string): Promise<any>
  getNetwork(): Promise<any>
  destroy?(): void
}

export class HeliosProviderWrapper implements RpcProvider {
  private heliosClient: HeliosRealIntegration | null = null
  private fallbackProvider: RpcProvider
  private isHeliosReady = false
  private initializationPromise: Promise<void> | null = null
  private readonly chainId: bigint

  constructor(fallbackProvider: RpcProvider, chainId: bigint) {
    this.fallbackProvider = fallbackProvider
    this.chainId = chainId
    
    // Only initialize Helios for Ethereum mainnet (chainId = 1)
    if (chainId === 1n) {
      this.initializeHelios()
    }
  }

  private async initializeHelios(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.performHeliosInitialization()
    return this.initializationPromise
  }

  private async performHeliosInitialization(): Promise<void> {
    try {
      console.log('🌟 Initializing Helios light client for Ethereum mainnet...')
      
      this.heliosClient = new HeliosRealIntegration()
      
      await this.heliosClient.initialize({
        executionRpc: 'https://rpc.flashbots.net',
        consensusRpc: 'https://www.lightclientdata.org',
        network: 'mainnet',
        checkpoint: null
      })
      
      this.isHeliosReady = true
      console.log('✅ Helios light client initialized successfully')
      
    } catch (error) {
      console.warn('⚠️ Helios initialization failed, using fallback provider:', error)
      this.isHeliosReady = false
      this.heliosClient = null
    }
  }

  async send(method: string, params: any[]): Promise<any> {
    // For Ethereum mainnet, try Helios first if available
    if (this.chainId === 1n && this.isHeliosReady && this.heliosClient) {
      try {
        const result = await this.sendViaHelios(method, params)
        console.log(`📡 Helios RPC success: ${method}`)
        return result
      } catch (error) {
        console.warn(`⚠️ Helios RPC failed for ${method}, falling back to default provider:`, error)
      }
    }

    // Fallback to default provider
    console.log(`🔄 Using fallback provider for ${method}`)
    return this.fallbackProvider.send(method, params)
  }

  private async sendViaHelios(method: string, params: any[]): Promise<any> {
    if (!this.heliosClient) {
      throw new Error('Helios client not available')
    }

    switch (method) {
      case 'eth_getBalance':
        if (params.length < 1) throw new Error('eth_getBalance requires address parameter')
        const balance = await this.heliosClient.getBalance(params[0])
        return `0x${BigInt(balance).toString(16)}`

      case 'eth_blockNumber':
        const blockNumber = await this.heliosClient.getBlockNumber()
        return `0x${BigInt(blockNumber).toString(16)}`

      case 'eth_chainId':
        const chainId = await this.heliosClient.getChainId()
        return `0x${BigInt(chainId).toString(16)}`

      case 'net_version':
        const netVersion = await this.heliosClient.getChainId()
        return netVersion.toString()

      case 'eth_getTransactionCount':
        if (params.length < 1) throw new Error('eth_getTransactionCount requires address parameter')
        const count = await this.heliosClient.getTransactionCount(params[0])
        return `0x${BigInt(count).toString(16)}`

      case 'eth_call':
        if (params.length < 1) throw new Error('eth_call requires transaction object')
        const callData = params[0]
        if (!callData.to || !callData.data) {
          throw new Error('eth_call requires to and data fields')
        }
        return await this.heliosClient.call(callData.to, callData.data)

      // For methods not supported by Helios, throw error to trigger fallback
      case 'eth_sendTransaction':
      case 'eth_sendRawTransaction':
      case 'eth_getTransactionByHash':
      case 'eth_getTransactionReceipt':
      case 'eth_getLogs':
      case 'eth_estimateGas':
      case 'eth_gasPrice':
      case 'eth_maxPriorityFeePerGas':
      case 'eth_feeHistory':
        throw new Error(`Method ${method} not supported by Helios light client`)

      default:
        throw new Error(`Unknown method ${method}`)
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    // Transaction receipts not supported by Helios light client
    // Always use fallback for this
    return this.fallbackProvider.getTransactionReceipt(txHash)
  }

  async getNetwork(): Promise<any> {
    if (this.chainId === 1n && this.isHeliosReady && this.heliosClient) {
      try {
        const chainId = await this.heliosClient.getChainId()
        return {
          chainId: Number(chainId),
          name: 'mainnet'
        }
      } catch (error) {
        console.warn('Helios getNetwork failed, using fallback:', error)
      }
    }

    return this.fallbackProvider.getNetwork()
  }

  destroy(): void {
    if (this.fallbackProvider.destroy) {
      this.fallbackProvider.destroy()
    }
    // Note: HeliosRealIntegration doesn't have a destroy method yet
    // Could be added later for cleanup
  }

  // Additional methods for monitoring Helios status
  isHeliosAvailable(): boolean {
    return this.isHeliosReady && this.heliosClient !== null
  }

  getProviderStatus(): { helios: boolean; fallback: boolean } {
    return {
      helios: this.isHeliosAvailable(),
      fallback: true // Fallback is always available
    }
  }

  async retryHeliosInitialization(): Promise<boolean> {
    if (this.chainId !== 1n) return false
    
    this.isHeliosReady = false
    this.heliosClient = null
    this.initializationPromise = null
    
    try {
      await this.initializeHelios()
      return this.isHeliosReady
    } catch (error) {
      console.error('Helios retry failed:', error)
      return false
    }
  }
}