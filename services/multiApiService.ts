interface ApiKey {
  key: string;
  name: string;
  isActive: boolean;
  lastUsed: Date;
  errorCount: number;
  rateLimitResetTime?: Date;
}

interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  lastError?: string;
  lastErrorTime?: Date;
}

class MultiApiService {
  private apiKeys: ApiKey[] = [];
  private currentIndex: number = 0;
  private usageStats: Map<string, ApiUsageStats> = new Map();
  private isEnabled: boolean = false;

  constructor() {
    this.loadApiKeys();
    this.loadUsageStats();
  }

  // Load API keys from localStorage
  private loadApiKeys(): void {
    try {
      const stored = localStorage.getItem('tradology_multi_api_keys');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.apiKeys = parsed.map((key: any) => ({
          ...key,
          lastUsed: new Date(key.lastUsed),
          rateLimitResetTime: key.rateLimitResetTime ? new Date(key.rateLimitResetTime) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      this.apiKeys = [];
    }
  }

  // Save API keys to localStorage
  private saveApiKeys(): void {
    try {
      localStorage.setItem('tradology_multi_api_keys', JSON.stringify(this.apiKeys));
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  }

  // Load usage stats from localStorage
  private loadUsageStats(): void {
    try {
      const stored = localStorage.getItem('tradology_api_usage_stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.usageStats = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }

  // Save usage stats to localStorage
  private saveUsageStats(): void {
    try {
      const statsObj = Object.fromEntries(this.usageStats);
      localStorage.setItem('tradology_api_usage_stats', JSON.stringify(statsObj));
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  // Add a new API key
  addApiKey(key: string, name: string): boolean {
    if (!key || !name) return false;
    
    // Check if key already exists
    if (this.apiKeys.some(k => k.key === key)) {
      return false;
    }

    const newKey: ApiKey = {
      key,
      name,
      isActive: true,
      lastUsed: new Date(),
      errorCount: 0
    };

    this.apiKeys.push(newKey);
    this.usageStats.set(key, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0
    });

    this.saveApiKeys();
    this.saveUsageStats();
    return true;
  }

  // Remove an API key
  removeApiKey(key: string): boolean {
    const index = this.apiKeys.findIndex(k => k.key === key);
    if (index === -1) return false;

    this.apiKeys.splice(index, 1);
    this.usageStats.delete(key);
    
    // Adjust current index if necessary
    if (this.currentIndex >= this.apiKeys.length) {
      this.currentIndex = 0;
    }

    this.saveApiKeys();
    this.saveUsageStats();
    return true;
  }

  // Get all API keys
  getApiKeys(): ApiKey[] {
    return [...this.apiKeys];
  }

  // Enable/disable multi-API mode
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('tradology_multi_api_enabled', JSON.stringify(enabled));
  }

  // Check if multi-API mode is enabled
  isMultiApiEnabled(): boolean {
    return this.isEnabled && this.apiKeys.length > 0;
  }

  // Get the next available API key
  getNextApiKey(): string | null {
    if (!this.isMultiApiEnabled()) {
      return null;
    }

    const activeKeys = this.apiKeys.filter(key => key.isActive);
    if (activeKeys.length === 0) {
      return null;
    }

    // Find the next available key (not rate limited)
    const now = new Date();
    let attempts = 0;
    
    while (attempts < activeKeys.length) {
      const key = activeKeys[this.currentIndex];
      
      // Check if key is rate limited
      if (key.rateLimitResetTime && key.rateLimitResetTime > now) {
        this.currentIndex = (this.currentIndex + 1) % activeKeys.length;
        attempts++;
        continue;
      }

      // Use this key
      key.lastUsed = now;
      this.saveApiKeys();
      return key.key;
    }

    // All keys are rate limited, return the first one anyway
    return activeKeys[0]?.key || null;
  }

  // Record API usage
  recordApiUsage(key: string, success: boolean, error?: string): void {
    const stats = this.usageStats.get(key) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0
    };

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
      stats.lastError = error;
      stats.lastErrorTime = new Date();
    }

    this.usageStats.set(key, stats);
    this.saveUsageStats();

    // Update key error count
    const apiKey = this.apiKeys.find(k => k.key === key);
    if (apiKey) {
      if (!success) {
        apiKey.errorCount++;
        
        // Check for rate limit errors
        if (error && (error.includes('rate limit') || error.includes('quota') || error.includes('429'))) {
          stats.rateLimitHits++;
          // Set rate limit reset time (typically 1 minute for Gemini)
          apiKey.rateLimitResetTime = new Date(Date.now() + 60 * 1000);
        }
      } else {
        // Reset error count on success
        apiKey.errorCount = 0;
        apiKey.rateLimitResetTime = undefined;
      }
      
      this.saveApiKeys();
    }
  }

  // Get usage statistics
  getUsageStats(): Map<string, ApiUsageStats> {
    return new Map(this.usageStats);
  }

  // Get overall statistics
  getOverallStats(): {
    totalKeys: number;
    activeKeys: number;
    totalRequests: number;
    successRate: number;
    rateLimitedKeys: number;
  } {
    const now = new Date();
    const activeKeys = this.apiKeys.filter(key => key.isActive);
    const rateLimitedKeys = this.apiKeys.filter(key => 
      key.rateLimitResetTime && key.rateLimitResetTime > now
    ).length;

    let totalRequests = 0;
    let successfulRequests = 0;

    this.usageStats.forEach(stats => {
      totalRequests += stats.totalRequests;
      successfulRequests += stats.successfulRequests;
    });

    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    return {
      totalKeys: this.apiKeys.length,
      activeKeys: activeKeys.length,
      totalRequests,
      successRate,
      rateLimitedKeys
    };
  }

  // Reset all statistics
  resetStats(): void {
    this.usageStats.clear();
    this.apiKeys.forEach(key => {
      key.errorCount = 0;
      key.rateLimitResetTime = undefined;
    });
    this.saveApiKeys();
    this.saveUsageStats();
  }

  // Toggle key active status
  toggleKeyStatus(key: string): boolean {
    const apiKey = this.apiKeys.find(k => k.key === key);
    if (!apiKey) return false;

    apiKey.isActive = !apiKey.isActive;
    this.saveApiKeys();
    return true;
  }
}

// Create singleton instance
export const multiApiService = new MultiApiService();
export type { ApiKey, ApiUsageStats };