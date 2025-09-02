interface DatabaseConfig {
  name: string;
  version: number;
  stores: {
    apiKeys: string;
    sessionHistory: string;
    usageStats: string;
  };
}

interface ApiKeyRecord {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  lastUsed: Date;
  errorCount: number;
  rateLimitResetTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionHistoryRecord {
  id: string;
  timestamp: Date;
  prompt: string;
  strategy: string;
  analysis: string;
  chartData: any[];
  sources?: { uri: string; title: string; }[];
  customInstructions?: string;
  createdAt: Date;
}

interface UsageStatsRecord {
  apiKeyId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  lastError?: string;
  lastErrorTime?: Date;
  lastUpdated: Date;
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig = {
    name: 'TradologyDB',
    version: 1,
    stores: {
      apiKeys: 'apiKeys',
      sessionHistory: 'sessionHistory',
      usageStats: 'usageStats'
    }
  };

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create API Keys store
        if (!db.objectStoreNames.contains(this.config.stores.apiKeys)) {
          const apiKeysStore = db.createObjectStore(this.config.stores.apiKeys, { keyPath: 'id' });
          apiKeysStore.createIndex('isActive', 'isActive', { unique: false });
          apiKeysStore.createIndex('lastUsed', 'lastUsed', { unique: false });
        }

        // Create Session History store
        if (!db.objectStoreNames.contains(this.config.stores.sessionHistory)) {
          const sessionStore = db.createObjectStore(this.config.stores.sessionHistory, { keyPath: 'id' });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
          sessionStore.createIndex('strategy', 'strategy', { unique: false });
        }

        // Create Usage Stats store
        if (!db.objectStoreNames.contains(this.config.stores.usageStats)) {
          const statsStore = db.createObjectStore(this.config.stores.usageStats, { keyPath: 'apiKeyId' });
          statsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  // API Keys operations
  async saveApiKey(apiKey: ApiKeyRecord): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.apiKeys], 'readwrite');
      const store = transaction.objectStore(this.config.stores.apiKeys);
      
      const request = store.put({
        ...apiKey,
        updatedAt: new Date()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getApiKey(id: string): Promise<ApiKeyRecord | null> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.apiKeys], 'readonly');
      const store = transaction.objectStore(this.config.stores.apiKeys);
      
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          result.lastUsed = new Date(result.lastUsed);
          result.createdAt = new Date(result.createdAt);
          result.updatedAt = new Date(result.updatedAt);
          if (result.rateLimitResetTime) {
            result.rateLimitResetTime = new Date(result.rateLimitResetTime);
          }
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllApiKeys(): Promise<ApiKeyRecord[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.apiKeys], 'readonly');
      const store = transaction.objectStore(this.config.stores.apiKeys);
      
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map((record: any) => ({
          ...record,
          lastUsed: new Date(record.lastUsed),
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
          rateLimitResetTime: record.rateLimitResetTime ? new Date(record.rateLimitResetTime) : undefined
        }));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.apiKeys], 'readwrite');
      const store = transaction.objectStore(this.config.stores.apiKeys);
      
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Session History operations
  async saveSessionHistory(session: SessionHistoryRecord): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.sessionHistory], 'readwrite');
      const store = transaction.objectStore(this.config.stores.sessionHistory);
      
      const request = store.put({
        ...session,
        createdAt: new Date()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSessionHistory(limit: number = 50): Promise<SessionHistoryRecord[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.sessionHistory], 'readonly');
      const store = transaction.objectStore(this.config.stores.sessionHistory);
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev');
      const results: SessionHistoryRecord[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          const record = cursor.value;
          results.push({
            ...record,
            timestamp: new Date(record.timestamp),
            createdAt: new Date(record.createdAt)
          });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSessionHistory(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.sessionHistory], 'readwrite');
      const store = transaction.objectStore(this.config.stores.sessionHistory);
      
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSessionHistory(): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.sessionHistory], 'readwrite');
      const store = transaction.objectStore(this.config.stores.sessionHistory);
      
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Usage Stats operations
  async saveUsageStats(stats: UsageStatsRecord): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.usageStats], 'readwrite');
      const store = transaction.objectStore(this.config.stores.usageStats);
      
      const request = store.put({
        ...stats,
        lastUpdated: new Date()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUsageStats(apiKeyId: string): Promise<UsageStatsRecord | null> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.usageStats], 'readonly');
      const store = transaction.objectStore(this.config.stores.usageStats);
      
      const request = store.get(apiKeyId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          result.lastUpdated = new Date(result.lastUpdated);
          if (result.lastErrorTime) {
            result.lastErrorTime = new Date(result.lastErrorTime);
          }
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsageStats(): Promise<UsageStatsRecord[]> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.usageStats], 'readonly');
      const store = transaction.objectStore(this.config.stores.usageStats);
      
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map((record: any) => ({
          ...record,
          lastUpdated: new Date(record.lastUpdated),
          lastErrorTime: record.lastErrorTime ? new Date(record.lastErrorTime) : undefined
        }));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearUsageStats(): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.usageStats], 'readwrite');
      const store = transaction.objectStore(this.config.stores.usageStats);
      
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate API keys
      const storedApiKeys = localStorage.getItem('tradology_multi_api_keys');
      if (storedApiKeys) {
        const apiKeys = JSON.parse(storedApiKeys);
        for (const key of apiKeys) {
          const apiKeyRecord: ApiKeyRecord = {
            id: key.key, // Use the key as ID
            key: key.key,
            name: key.name,
            isActive: key.isActive,
            lastUsed: new Date(key.lastUsed),
            errorCount: key.errorCount,
            rateLimitResetTime: key.rateLimitResetTime ? new Date(key.rateLimitResetTime) : undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await this.saveApiKey(apiKeyRecord);
        }
        console.log('Migrated API keys from localStorage');
      }

      // Migrate session history
      const storedHistory = localStorage.getItem('tradology_session_history');
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        for (const session of history.sessions) {
          const sessionRecord: SessionHistoryRecord = {
            id: session.id,
            timestamp: new Date(session.timestamp),
            prompt: session.prompt,
            strategy: session.strategy,
            analysis: session.analysis,
            chartData: session.chartData,
            sources: session.sources,
            customInstructions: session.customInstructions,
            createdAt: new Date()
          };
          await this.saveSessionHistory(sessionRecord);
        }
        console.log('Migrated session history from localStorage');
      }

      // Migrate usage stats
      const storedStats = localStorage.getItem('tradology_api_usage_stats');
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        for (const [apiKeyId, statData] of Object.entries(stats)) {
          const statsRecord: UsageStatsRecord = {
            apiKeyId,
            totalRequests: (statData as any).totalRequests,
            successfulRequests: (statData as any).successfulRequests,
            failedRequests: (statData as any).failedRequests,
            rateLimitHits: (statData as any).rateLimitHits,
            lastError: (statData as any).lastError,
            lastErrorTime: (statData as any).lastErrorTime ? new Date((statData as any).lastErrorTime) : undefined,
            lastUpdated: new Date()
          };
          await this.saveUsageStats(statsRecord);
        }
        console.log('Migrated usage stats from localStorage');
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('tradology_multi_api_keys');
      localStorage.removeItem('tradology_session_history');
      localStorage.removeItem('tradology_api_usage_stats');
      localStorage.removeItem('tradology_multi_api_enabled');
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // Database info
  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    apiKeysCount: number;
    sessionHistoryCount: number;
    usageStatsCount: number;
  }> {
    await this.ensureInitialized();
    
    const apiKeys = await this.getAllApiKeys();
    const sessionHistory = await this.getSessionHistory(1000); // Get more to count
    const usageStats = await this.getAllUsageStats();

    return {
      name: this.config.name,
      version: this.config.version,
      apiKeysCount: apiKeys.length,
      sessionHistoryCount: sessionHistory.length,
      usageStatsCount: usageStats.length
    };
  }
}

// Create singleton instance
export const databaseService = new DatabaseService();
export type { ApiKeyRecord, SessionHistoryRecord, UsageStatsRecord };