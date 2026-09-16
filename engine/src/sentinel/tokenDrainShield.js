export class TokenDrainShield {
  constructor(options = {}) {
    this.maxTokensPerMinute = options.maxTokensPerMinute || 60;
    this.windowMs = options.windowMs || 60000;
    this.clientWindows = new Map();
  }

  /**
   * Inspects incoming request and determines if it triggers a Token Drain / Denial of Wallet threshold.
   */
  checkRequest(clientId) {
    const now = Date.now();
    let record = this.clientWindows.get(clientId);

    if (!record || now - record.windowStart > this.windowMs) {
      record = {
        windowStart: now,
        count: 1,
      };
      this.clientWindows.set(clientId, record);
      return {
        allowed: true,
        remaining: this.maxTokensPerMinute - 1,
        resetInMs: this.windowMs,
      };
    }

    record.count++;

    if (record.count > this.maxTokensPerMinute) {
      const resetInMs = this.windowMs - (now - record.windowStart);
      return {
        allowed: false,
        remaining: 0,
        resetInMs,
        error: 'Denial-of-Wallet Shield: Burst rate limit exceeded. AI/API resource protected.',
      };
    }

    return {
      allowed: true,
      remaining: this.maxTokensPerMinute - record.count,
      resetInMs: this.windowMs - (now - record.windowStart),
    };
  }

  reset() {
    this.clientWindows.clear();
  }
}
