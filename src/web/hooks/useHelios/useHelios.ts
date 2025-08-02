import { useState, useEffect, useCallback } from 'react'
import { getHeliosProvider, type HeliosConfig } from '../../services/helios'

export interface UseHeliosReturn {
  isLoading: boolean
  isReady: boolean
  error: string | null
  getBalance: (address: string) => Promise<string>
  getTransactionCount: (address: string) => Promise<number>
  call: (to: string, data: string) => Promise<string>
  getBlockNumber: () => Promise<number>
  getChainId: () => Promise<number>
  initialize: () => Promise<void>
}

export const useHelios = (config?: HeliosConfig): UseHeliosReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider] = useState(() => getHeliosProvider(config))

  const initialize = useCallback(async () => {
    if (isReady || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      await provider.initialize()
      setIsReady(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Helios'
      setError(errorMessage)
      console.error('Helios initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [provider, isReady, isLoading])

  const getBalance = useCallback(async (address: string): Promise<string> => {
    if (!isReady) {
      throw new Error('Helios not initialized')
    }
    return provider.getBalance(address)
  }, [provider, isReady])

  const getTransactionCount = useCallback(async (address: string): Promise<number> => {
    if (!isReady) {
      throw new Error('Helios not initialized')
    }
    return provider.getTransactionCount(address)
  }, [provider, isReady])

  const call = useCallback(async (to: string, data: string): Promise<string> => {
    if (!isReady) {
      throw new Error('Helios not initialized')
    }
    return provider.call(to, data)
  }, [provider, isReady])

  const getBlockNumber = useCallback(async (): Promise<number> => {
    if (!isReady) {
      throw new Error('Helios not initialized')
    }
    return provider.getBlockNumber()
  }, [provider, isReady])

  const getChainId = useCallback(async (): Promise<number> => {
    if (!isReady) {
      throw new Error('Helios not initialized')
    }
    return provider.getChainId()
  }, [provider, isReady])

  // Auto-initialize on mount
  useEffect(() => {
    if (!isReady && !isLoading) {
      initialize()
    }
  }, [initialize, isReady, isLoading])

  return {
    isLoading,
    isReady,
    error,
    getBalance,
    getTransactionCount,
    call,
    getBlockNumber,
    getChainId,
    initialize
  }
}