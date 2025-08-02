/**
 * P2P Send Provider - Manages connection to the DevP2P bridge for direct peer-to-peer transaction broadcasting
 */

export interface P2PSendConnectionStatus {
  connected: boolean
  peers: number
  bridgeUrl: string
}

export interface P2PSendBroadcastResult {
  success: boolean
  txHash: string
  peersNotified: number
  totalPeers: number
  error?: string
}

export interface P2PSendMessage {
  type: string
  data?: any
  requestId?: string
}

export class P2PSendProvider {
  private ws: WebSocket | null = null
  private isConnected = false
  private reconnectInterval = 5000
  private maxReconnectAttempts = 5
  private reconnectAttempts = 0
  private bridgeUrl: string
  private listeners: Map<string, Function[]> = new Map()
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map()
  private requestCounter = 0

  constructor(bridgeUrl = 'ws://localhost:8546') {
    this.bridgeUrl = bridgeUrl
    this.connect()
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.bridgeUrl)
      
      this.ws.onopen = () => {
        console.log('P2P Bridge connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connection', { connected: true })
      }

      this.ws.onclose = () => {
        console.log('P2P Bridge disconnected')
        this.isConnected = false
        this.emit('connection', { connected: false })
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => this.connect(), this.reconnectInterval)
        }
      }

      this.ws.onerror = (error) => {
        console.error('P2P Bridge error:', error)
        this.emit('error', error)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse P2P bridge message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to connect to P2P bridge:', error)
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(), this.reconnectInterval)
      }
    }
  }

  private handleMessage(message: P2PSendMessage) {
    const { type, data, requestId } = message

    // Handle request responses
    if (requestId && this.pendingRequests.has(requestId)) {
      const { resolve } = this.pendingRequests.get(requestId)!
      this.pendingRequests.delete(requestId)
      resolve(data)
      return
    }

    // Handle events
    switch (type) {
      case 'status':
        this.emit('status', data)
        break
      case 'peer:added':
        this.emit('peer:added', data)
        break
      case 'peer:removed':
        this.emit('peer:removed', data)
        break
      case 'broadcast_result':
        this.emit('broadcast_result', data)
        break
      case 'new_transaction':
        this.emit('new_transaction', data)
        break
      case 'error':
        this.emit('error', data)
        break
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event) || []
    eventListeners.forEach(listener => listener(data))
  }

  private send(message: P2PSendMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('P2P bridge not connected'))
        return
      }

      const requestId = `req_${++this.requestCounter}`
      const messageWithId = { ...message, requestId }

      this.pendingRequests.set(requestId, { resolve, reject })

      try {
        this.ws.send(JSON.stringify(messageWithId))
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId)
            reject(new Error('Request timeout'))
          }
        }, 30000)
      } catch (error) {
        this.pendingRequests.delete(requestId)
        reject(error)
      }
    })
  }

  /**
   * Check if P2P bridge is available and connected
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isConnected) {
      return false
    }

    try {
      await this.getConnectionStatus()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get connection status and peer count
   */
  async getConnectionStatus(): Promise<P2PSendConnectionStatus> {
    const data = await this.send({ type: 'get_peers' })
    return {
      connected: this.isConnected,
      peers: data?.peers?.length || 0,
      bridgeUrl: this.bridgeUrl
    }
  }

  /**
   * Broadcast a signed transaction directly to Ethereum peers
   */
  async broadcastTransaction(signedTx: string, txHash: string): Promise<P2PSendBroadcastResult> {
    if (!signedTx || !txHash) {
      throw new Error('signedTx and txHash are required')
    }

    if (!signedTx.startsWith('0x')) {
      signedTx = '0x' + signedTx
    }

    if (!txHash.startsWith('0x')) {
      txHash = '0x' + txHash
    }

    try {
      const result = await this.send({
        type: 'broadcast_transaction',
        data: { signedTx, txHash }
      })

      return {
        success: true,
        txHash,
        peersNotified: result.successCount || 0,
        totalPeers: result.totalPeers || 0
      }
    } catch (error) {
      return {
        success: false,
        txHash,
        peersNotified: 0,
        totalPeers: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      return
    }
    const eventListeners = this.listeners.get(event)!
    const index = eventListeners.indexOf(listener)
    if (index > -1) {
      eventListeners.splice(index, 1)
    }
  }

  /**
   * Close connection and cleanup
   */
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.pendingRequests.clear()
    this.listeners.clear()
  }
}

// Singleton instance
let p2pSendProvider: P2PSendProvider | null = null

export function getP2PSendProvider(): P2PSendProvider {
  if (!p2pSendProvider) {
    p2pSendProvider = new P2PSendProvider()
  }
  return p2pSendProvider
}