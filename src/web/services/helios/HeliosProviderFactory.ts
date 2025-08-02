import { HeliosProviderWrapper, RpcProvider } from './HeliosProviderWrapper'

export interface NetworkConfig {
  chainId: bigint
  rpcUrls: string[]
  selectedRpcUrl?: string
  name: string
}

export class HeliosProviderFactory {
  /**
   * Creates a provider that uses Helios for Ethereum mainnet with fallback to standard RPC
   * For other networks, returns the standard RPC provider
   */
  static createProvider(
    network: NetworkConfig,
    fallbackProviderFactory: (rpcUrls: string[], chainId: bigint, selectedRpcUrl?: string) => RpcProvider
  ): RpcProvider {
    // Create the fallback provider using the standard factory
    const fallbackProvider = fallbackProviderFactory(
      network.rpcUrls,
      network.chainId,
      network.selectedRpcUrl
    )

    // For Ethereum mainnet (chainId = 1), use Helios with fallback
    if (network.chainId === 1n) {
      console.log('🌟 Creating Helios-enabled provider for Ethereum mainnet')
      return new HeliosProviderWrapper(fallbackProvider, network.chainId)
    }

    // For other networks, use standard provider
    console.log(`🔄 Using standard provider for network ${network.name} (chainId: ${network.chainId})`)
    return fallbackProvider
  }

  /**
   * Check if Helios is supported for the given network
   */
  static isHeliosSupported(chainId: bigint): boolean {
    return chainId === 1n // Only Ethereum mainnet for now
  }

  /**
   * Get Helios status for all providers
   */
  static getHeliosStatus(providers: { [chainId: string]: RpcProvider }): { [chainId: string]: any } {
    const status: { [chainId: string]: any } = {}

    Object.entries(providers).forEach(([chainId, provider]) => {
      if (provider instanceof HeliosProviderWrapper) {
        status[chainId] = {
          heliosSupported: true,
          heliosAvailable: provider.isHeliosAvailable(),
          providerStatus: provider.getProviderStatus()
        }
      } else {
        status[chainId] = {
          heliosSupported: false,
          heliosAvailable: false,
          providerStatus: { helios: false, fallback: true }
        }
      }
    })

    return status
  }

  /**
   * Retry Helios initialization for all supported networks
   */
  static async retryHeliosInitialization(providers: { [chainId: string]: RpcProvider }): Promise<{ [chainId: string]: boolean }> {
    const results: { [chainId: string]: boolean } = {}

    const retryPromises = Object.entries(providers).map(async ([chainId, provider]) => {
      if (provider instanceof HeliosProviderWrapper) {
        try {
          const success = await provider.retryHeliosInitialization()
          results[chainId] = success
          console.log(`Helios retry for chainId ${chainId}: ${success ? 'SUCCESS' : 'FAILED'}`)
        } catch (error) {
          console.error(`Helios retry failed for chainId ${chainId}:`, error)
          results[chainId] = false
        }
      } else {
        results[chainId] = false // Not a Helios provider
      }
    })

    await Promise.all(retryPromises)
    return results
  }
}