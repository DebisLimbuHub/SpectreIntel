/**
 * Circuit Breaker Pattern
 * Adapted from WorldMonitor's fault tolerance system.
 *
 * Each external API is wrapped in a circuit breaker that tracks failures.
 * After consecutive failures, the breaker opens and returns cached data
 * during a cooldown period to prevent hammering failing services.
 *
 * States:
 *   CLOSED  → Normal operation, requests pass through
 *   OPEN    → Service failing, return cached data, wait for cooldown
 *   HALF-OPEN → Cooldown expired, try one request to test recovery
 */

interface CircuitBreakerOptions {
  failureThreshold: number;  // Failures before opening (default: 3)
  cooldownMs: number;        // Time to wait before retrying (default: 300000 = 5 min)
  cacheTtlMs: number;        // How long cached data is valid (default: 600000 = 10 min)
  onStateChange?: (service: string, state: 'closed' | 'open' | 'half-open') => void;
}

interface CachedResult<T> {
  data: T;
  timestamp: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker<T> {
  private service: string;
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailure: number | null = null;
  private cache: CachedResult<T> | null = null;
  private opts: Required<CircuitBreakerOptions>;

  constructor(service: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.service = service;
    this.opts = {
      failureThreshold: options.failureThreshold ?? 3,
      cooldownMs: options.cooldownMs ?? 300_000,
      cacheTtlMs: options.cacheTtlMs ?? 600_000,
      onStateChange: options.onStateChange ?? (() => {}),
    };
  }

  async call(fn: () => Promise<T>): Promise<T> {
    // If OPEN, check if cooldown expired
    if (this.state === 'open') {
      const elapsed = Date.now() - (this.lastFailure ?? 0);
      if (elapsed < this.opts.cooldownMs) {
        // Still in cooldown — return cached data if available
        if (this.cache && Date.now() - this.cache.timestamp < this.opts.cacheTtlMs) {
          console.warn(`[CircuitBreaker:${this.service}] OPEN — returning cached data`);
          return this.cache.data;
        }
        throw new Error(`[CircuitBreaker:${this.service}] Service unavailable (cooldown)`);
      }
      // Cooldown expired — transition to HALF-OPEN
      this.transition('half-open');
    }

    try {
      const result = await fn();
      this.onSuccess(result);
      return result;
    } catch (error) {
      this.onFailure();
      // Return cached data if available
      if (this.cache && Date.now() - this.cache.timestamp < this.opts.cacheTtlMs) {
        console.warn(`[CircuitBreaker:${this.service}] Failed — returning cached data`);
        return this.cache.data;
      }
      throw error;
    }
  }

  private onSuccess(data: T): void {
    this.failures = 0;
    this.cache = { data, timestamp: Date.now() };
    if (this.state !== 'closed') {
      this.transition('closed');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.opts.failureThreshold) {
      this.transition('open');
    }
  }

  private transition(newState: CircuitState): void {
    if (this.state !== newState) {
      console.log(`[CircuitBreaker:${this.service}] ${this.state} → ${newState}`);
      this.state = newState;
      this.opts.onStateChange(this.service, newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  getCachedData(): T | null {
    if (this.cache && Date.now() - this.cache.timestamp < this.opts.cacheTtlMs) {
      return this.cache.data;
    }
    return null;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailure = null;
  }
}
