# Helios Light Client Integration

This document describes how the Helios light client has been integrated into the Ambire wallet project.

## Overview

Helios is a light client for Ethereum that provides trustless access to the blockchain without needing to run a full node. It uses WASM to run in web browsers and provides JSON-RPC compatible APIs.

## Integration Components

### 1. WASM Assets (`src/web/assets/wasm/`)
- `helios.wasm` - The compiled WASM binary
- `helios.js` - JavaScript wrapper for the WASM module
- `helios.d.ts` - TypeScript definitions

### 2. Services (`src/web/services/helios/`)
- `HeliosWasmLoader.ts` - Manages WASM module loading
- `HeliosProvider.ts` - Main service provider for Helios functionality
- `index.ts` - Exports for the service

### 3. React Hook (`src/web/hooks/useHelios/`)
- `useHelios.ts` - React hook for using Helios in components
- `index.ts` - Hook exports

### 4. Test Component (`src/web/components/HeliosTest/`)
- `HeliosTest.tsx` - Test component to verify integration
- `index.ts` - Component exports

## Usage

### Basic Usage with React Hook

```tsx
import { useHelios } from '../../hooks/useHelios'

function MyComponent() {
  const { 
    isLoading, 
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
    if (isReady) {
      const balance = await getBalance('0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2')
      console.log('Balance:', balance)
    }
  }

  return (
    <div>
      <p>Status: {isReady ? 'Ready' : 'Loading...'}</p>
      {error && <p>Error: {error}</p>}
      <button onClick={handleGetBalance} disabled={!isReady}>
        Get Balance
      </button>
    </div>
  )
}
```

### Direct Service Usage

```tsx
import { getHeliosProvider } from '../services/helios'

async function useHeliosDirectly() {
  const provider = getHeliosProvider({
    network: 'mainnet',
    consensusRpc: 'https://www.lightclientdata.org',
    executionRpc: 'https://rpc.flashbots.net'
  })

  await provider.initialize()
  const balance = await provider.getBalance('0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2')
  console.log('Balance:', balance)
}
```

## Configuration Options

- `network`: Network to connect to ('mainnet', 'sepolia', 'holesky')
- `consensusRpc`: Consensus layer RPC endpoint
- `executionRpc`: Execution layer RPC endpoint  
- `verifiableApi`: Optional verifiable API endpoint
- `checkpoint`: Optional checkpoint for faster sync
- `dbType`: Database type ('memory' by default)

## Available Methods

- `getBalance(address: string): Promise<string>` - Get account balance
- `getTransactionCount(address: string): Promise<number>` - Get nonce
- `call(to: string, data: string): Promise<string>` - Execute read-only call
- `getBlockNumber(): Promise<number>` - Get latest block number
- `getChainId(): Promise<number>` - Get chain ID

## Testing

Use the `HeliosTest` component to verify the integration:

```tsx
import { HeliosTest } from '../components/HeliosTest'

function App() {
  return (
    <div>
      <HeliosTest />
    </div>
  )
}
```

## Webpack Configuration

The webpack configuration has been updated to support WASM loading:
- `asyncWebAssembly: true` enables WASM support
- WASM files are copied to the build assets directory

## Dependencies

- `@a16z/helios` - The Helios light client package (added to package.json)

## Notes

- The client needs to sync with the consensus layer before it can serve requests
- Initial sync may take some time depending on network conditions
- The WASM module is loaded asynchronously to avoid blocking the main thread