import type { EthereumClient } from '../../../web/assets/wasm/helios'

export class HeliosWasmLoader {
  private static instance: HeliosWasmLoader | null = null
  private ethereumClientClass: typeof EthereumClient | null = null
  private isLoaded = false
  private loadingPromise: Promise<typeof EthereumClient> | null = null

  private constructor() {}

  static getInstance(): HeliosWasmLoader {
    if (!HeliosWasmLoader.instance) {
      HeliosWasmLoader.instance = new HeliosWasmLoader()
    }
    return HeliosWasmLoader.instance
  }

  async loadWasm(): Promise<typeof EthereumClient> {
    if (this.isLoaded && this.ethereumClientClass) {
      return this.ethereumClientClass
    }

    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = this.initializeWasm()
    return this.loadingPromise
  }

  private async initializeWasm(): Promise<typeof EthereumClient> {
    try {
      // Import the WASM module
      const wasmModule = await import('../../../web/assets/wasm/helios')
      await wasmModule.default()

      // Store the EthereumClient class constructor
      this.ethereumClientClass = wasmModule.EthereumClient
      this.isLoaded = true
      return this.ethereumClientClass
    } catch (error) {
      console.error('Failed to load Helios WASM:', error)
      throw error
    }
  }

  getEthereumClientClass(): typeof EthereumClient | null {
    return this.ethereumClientClass
  }

  isWasmLoaded(): boolean {
    return this.isLoaded
  }
}

export const heliosWasmLoader = HeliosWasmLoader.getInstance()