export interface HeliosHealthStatus {
  isInitialized: boolean
  isReady: boolean
  lastHealthCheck: number
  errorCount: number
  lastError: string | null
  averageResponseTime: number
  successfulRequests: number
  failedRequests: number
}

export class HeliosHealthMonitor {
  private status: HeliosHealthStatus = {
    isInitialized: false,
    isReady: false,
    lastHealthCheck: 0,
    errorCount: 0,
    lastError: null,
    averageResponseTime: 0,
    successfulRequests: 0,
    failedRequests: 0
  }

  private responseTimes: number[] = []
  private readonly maxResponseTimesSamples = 50

  recordSuccess(responseTime: number): void {
    this.status.successfulRequests++
    this.responseTimes.push(responseTime)
    
    // Keep only the last N samples
    if (this.responseTimes.length > this.maxResponseTimesSamples) {
      this.responseTimes.shift()
    }
    
    // Update average response time
    this.status.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  recordFailure(error: string): void {
    this.status.failedRequests++
    this.status.errorCount++
    this.status.lastError = error
  }

  updateInitializationStatus(isInitialized: boolean, isReady: boolean): void {
    this.status.isInitialized = isInitialized
    this.status.isReady = isReady
    this.status.lastHealthCheck = Date.now()
  }

  getStatus(): HeliosHealthStatus {
    return { ...this.status }
  }

  getHealthScore(): number {
    const total = this.status.successfulRequests + this.status.failedRequests
    if (total === 0) return this.status.isReady ? 1.0 : 0.0
    
    const successRate = this.status.successfulRequests / total
    const readinessScore = this.status.isReady ? 1.0 : 0.0
    const timeScore = this.status.averageResponseTime > 0 
      ? Math.max(0, 1 - (this.status.averageResponseTime - 1000) / 5000) // Good if < 1s, bad if > 6s
      : 1.0
    
    return (successRate * 0.5 + readinessScore * 0.3 + timeScore * 0.2)
  }

  shouldUseHelios(): boolean {
    return this.status.isReady && this.getHealthScore() > 0.7
  }

  reset(): void {
    this.status = {
      isInitialized: false,
      isReady: false,
      lastHealthCheck: 0,
      errorCount: 0,
      lastError: null,
      averageResponseTime: 0,
      successfulRequests: 0,
      failedRequests: 0
    }
    this.responseTimes = []
  }

  getDetailedReport(): string {
    const total = this.status.successfulRequests + this.status.failedRequests
    const successRate = total > 0 ? (this.status.successfulRequests / total * 100).toFixed(1) : '0'
    const healthScore = (this.getHealthScore() * 100).toFixed(1)
    
    return `Helios Health Report:
- Status: ${this.status.isReady ? 'Ready' : 'Not Ready'}
- Health Score: ${healthScore}%
- Success Rate: ${successRate}% (${this.status.successfulRequests}/${total})
- Average Response Time: ${this.status.averageResponseTime.toFixed(0)}ms
- Error Count: ${this.status.errorCount}
- Last Error: ${this.status.lastError || 'None'}
- Should Use Helios: ${this.shouldUseHelios() ? 'Yes' : 'No'}`
  }
}