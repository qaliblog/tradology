import type { AnalysisResult } from '../types';
import { databaseService, type ApiKeyRecord, type UsageStatsRecord } from './databaseService';

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

class MultiApiServiceDB {
  private apiKeys: ApiKey[] = [];
  private currentIndex: number = 0;
  private usageStats: Map<string, ApiUsageStats> = new Map();
  private isEnabled: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await databaseService.initialize();
      await this.loadApiKeys();
      await this.loadUsageStats();
      this.loadEnabledState();
      this.initialized = true;
      console.log('MultiApiServiceDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MultiApiServiceDB:', error);
      // Fallback to localStorage if database fails
      this.loadFromLocalStorage();
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Load API keys from database
  private async loadApiKeys(): Promise<void> {
    try {
      const dbKeys = await databaseService.getAllApiKeys();
      this.apiKeys = dbKeys.map(key => ({
        key: key.key,
        name: key.name,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        errorCount: key.errorCount,
        rateLimitResetTime: key.rateLimitResetTime
      }));
    } catch (error) {
      console.error('Failed to load API keys from database:', error);
      this.apiKeys = [];
    }
  }

  // Load usage stats from database
  private async loadUsageStats(): Promise<void> {
    try {
      const dbStats = await databaseService.getAllUsageStats();
      this.usageStats.clear();
      
      for (const stat of dbStats) {
        this.usageStats.set(stat.apiKeyId, {
          totalRequests: stat.totalRequests,
          successfulRequests: stat.successfulRequests,
          failedRequests: stat.failedRequests,
          rateLimitHits: stat.rateLimitHits,
          lastError: stat.lastError,
          lastErrorTime: stat.lastErrorTime
        });
      }
    } catch (error) {
      console.error('Failed to load usage stats from database:', error);
      this.usageStats.clear();
    }
  }

  // Load enabled state from localStorage (fallback)
  private loadEnabledState(): void {
    try {
      const stored = localStorage.getItem('tradology_multi_api_enabled');
      this.isEnabled = stored ? JSON.parse(stored) : false;
    } catch (error) {
      console.error('Failed to load enabled state:', error);
      this.isEnabled = false;
    }
  }

  // Fallback to localStorage if database fails
  private loadFromLocalStorage(): void {
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

      const storedStats = localStorage.getItem('tradology_api_usage_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        this.usageStats = new Map(Object.entries(parsed));
      }

      this.loadEnabledState();
      console.log('Loaded data from localStorage fallback');
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  // Add a new API key
  async addApiKey(key: string, name: string): Promise<boolean> {
    await this.ensureInitialized();
    
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

    try {
      // Save to database
      const apiKeyRecord: ApiKeyRecord = {
        id: key,
        key,
        name,
        isActive: true,
        lastUsed: new Date(),
        errorCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await databaseService.saveApiKey(apiKeyRecord);
      
      // Initialize usage stats
      const statsRecord: UsageStatsRecord = {
        apiKeyId: key,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        lastUpdated: new Date()
      };
      
      await databaseService.saveUsageStats(statsRecord);

      // Update local state
      this.apiKeys.push(newKey);
      this.usageStats.set(key, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0
      });

      return true;
    } catch (error) {
      console.error('Failed to add API key to database:', error);
      // Fallback to localStorage
      this.apiKeys.push(newKey);
      this.usageStats.set(key, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0
      });
      this.saveToLocalStorage();
      return true;
    }
  }

  // Remove an API key
  async removeApiKey(key: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const index = this.apiKeys.findIndex(k => k.key === key);
    if (index === -1) return false;

    try {
      // Remove from database
      await databaseService.deleteApiKey(key);
      
      // Update local state
      this.apiKeys.splice(index, 1);
      this.usageStats.delete(key);
      
      // Adjust current index if necessary
      if (this.currentIndex >= this.apiKeys.length) {
        this.currentIndex = 0;
      }

      return true;
    } catch (error) {
      console.error('Failed to remove API key from database:', error);
      // Fallback to localStorage
      this.apiKeys.splice(index, 1);
      this.usageStats.delete(key);
      this.saveToLocalStorage();
      return true;
    }
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
      this.updateApiKeyInDatabase(key);
      return key.key;
    }

    // All keys are rate limited, return the first one anyway
    return activeKeys[0]?.key || null;
  }

  // Update API key in database
  private async updateApiKeyInDatabase(key: ApiKey): Promise<void> {
    try {
      const apiKeyRecord: ApiKeyRecord = {
        id: key.key,
        key: key.key,
        name: key.name,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        errorCount: key.errorCount,
        rateLimitResetTime: key.rateLimitResetTime,
        createdAt: new Date(), // This should be preserved, but we don't have it
        updatedAt: new Date()
      };
      
      await databaseService.saveApiKey(apiKeyRecord);
    } catch (error) {
      console.error('Failed to update API key in database:', error);
      this.saveToLocalStorage();
    }
  }

  // Record API usage
  async recordApiUsage(key: string, success: boolean, error?: string): Promise<void> {
    await this.ensureInitialized();
    
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
      
      await this.updateApiKeyInDatabase(apiKey);
    }

    // Update usage stats in database
    try {
      const statsRecord: UsageStatsRecord = {
        apiKeyId: key,
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        rateLimitHits: stats.rateLimitHits,
        lastError: stats.lastError,
        lastErrorTime: stats.lastErrorTime,
        lastUpdated: new Date()
      };
      
      await databaseService.saveUsageStats(statsRecord);
    } catch (error) {
      console.error('Failed to update usage stats in database:', error);
      this.saveToLocalStorage();
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
  async resetStats(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await databaseService.clearUsageStats();
      this.usageStats.clear();
      
      // Reset error counts for all keys
      for (const key of this.apiKeys) {
        key.errorCount = 0;
        key.rateLimitResetTime = undefined;
        await this.updateApiKeyInDatabase(key);
      }
    } catch (error) {
      console.error('Failed to reset stats in database:', error);
      this.usageStats.clear();
      this.apiKeys.forEach(key => {
        key.errorCount = 0;
        key.rateLimitResetTime = undefined;
      });
      this.saveToLocalStorage();
    }
  }

  // Toggle key active status
  async toggleKeyStatus(key: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const apiKey = this.apiKeys.find(k => k.key === key);
    if (!apiKey) return false;

    apiKey.isActive = !apiKey.isActive;
    await this.updateApiKeyInDatabase(apiKey);
    return true;
  }

  // Fallback localStorage methods
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('tradology_multi_api_keys', JSON.stringify(this.apiKeys));
      const statsObj = Object.fromEntries(this.usageStats);
      localStorage.setItem('tradology_api_usage_stats', JSON.stringify(statsObj));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Migrate from localStorage to database
  async migrateFromLocalStorage(): Promise<void> {
    try {
      await databaseService.migrateFromLocalStorage();
      await this.loadApiKeys();
      await this.loadUsageStats();
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
}

// Create singleton instance
export const multiApiService = new MultiApiServiceDB();
export type { ApiKey, ApiUsageStats };