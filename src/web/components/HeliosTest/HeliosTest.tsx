import React, { useState } from 'react'
import { useHelios } from '../../hooks/useHelios'

export const HeliosTest: React.FC = () => {
  const [testAddress, setTestAddress] = useState('0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2')
  const [balance, setBalance] = useState<string | null>(null)
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const { 
    isLoading: heliosLoading, 
    isReady, 
    error, 
    getBalance, 
    getBlockNumber, 
    getChainId 
  } = useHelios({
    network: 'mainnet',
    consensusRpc: 'https://www.lightclientdata.org',
    executionRpc: 'https://rpc.flashbots.net'
  })

  const handleGetBalance = async () => {
    if (!isReady) return
    setLoading(true)
    try {
      const bal = await getBalance(testAddress)
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

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Helios Light Client Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Status:</h3>
        <p>Loading: {heliosLoading ? 'Yes' : 'No'}</p>
        <p>Ready: {isReady ? 'Yes' : 'No'}</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Address:</h3>
        <input
          type="text"
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          style={{ width: '400px', padding: '5px' }}
          placeholder="Enter Ethereum address"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Actions:</h3>
        <button 
          onClick={handleGetBalance}
          disabled={!isReady || loading}
          style={{ margin: '0 5px', padding: '5px 10px' }}
        >
          Get Balance
        </button>
        <button 
          onClick={handleGetBlockNumber}
          disabled={!isReady || loading}
          style={{ margin: '0 5px', padding: '5px 10px' }}
        >
          Get Block Number
        </button>
        <button 
          onClick={handleGetChainId}
          disabled={!isReady || loading}
          style={{ margin: '0 5px', padding: '5px 10px' }}
        >
          Get Chain ID
        </button>
      </div>

      <div>
        <h3>Results:</h3>
        {balance && <p>Balance: {balance} wei</p>}
        {blockNumber !== null && <p>Block Number: {blockNumber}</p>}
        {chainId !== null && <p>Chain ID: {chainId}</p>}
        {loading && <p>Loading...</p>}
      </div>
    </div>
  )
}