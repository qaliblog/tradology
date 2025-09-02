import React, { useState, useEffect } from 'react';
import { multiApiService, type ApiKey, type ApiUsageStats } from '../services/multiApiService';

interface MultiApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MultiApiSettings: React.FC<MultiApiSettingsProps> = ({ isOpen, onClose }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<Map<string, ApiUsageStats>>(new Map());
  const [isEnabled, setIsEnabled] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setApiKeys(multiApiService.getApiKeys());
    setUsageStats(multiApiService.getUsageStats());
    setIsEnabled(multiApiService.isMultiApiEnabled());
  };

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      alert('Please enter both name and API key');
      return;
    }

    setIsLoading(true);
    try {
      const success = multiApiService.addApiKey(newKeyValue.trim(), newKeyName.trim());
      if (success) {
        setNewKeyName('');
        setNewKeyValue('');
        loadData();
      } else {
        alert('API key already exists or is invalid');
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = (key: string) => {
    if (window.confirm('Are you sure you want to remove this API key?')) {
      multiApiService.removeApiKey(key);
      loadData();
    }
  };

  const handleToggleKey = (key: string) => {
    multiApiService.toggleKeyStatus(key);
    loadData();
  };

  const handleToggleEnabled = () => {
    const newEnabled = !isEnabled;
    multiApiService.setEnabled(newEnabled);
    setIsEnabled(newEnabled);
  };

  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all statistics?')) {
      multiApiService.resetStats();
      loadData();
    }
  };

  const getOverallStats = () => {
    return multiApiService.getOverallStats();
  };

  if (!isOpen) return null;

  const overallStats = getOverallStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Multi-API Settings</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - API Keys Management */}
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Multi-API Mode</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={handleToggleEnabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-400">
                  When enabled, the system will automatically cycle through multiple API keys to avoid rate limits.
                </p>
              </div>

              {/* Add New API Key */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Add New API Key</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="API Key Name (e.g., Primary, Backup 1)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Gemini API Key"
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddKey}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Adding...' : 'Add API Key'}
                  </button>
                </div>
              </div>

              {/* API Keys List */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">API Keys ({apiKeys.length})</h3>
                {apiKeys.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No API keys added yet</p>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((key) => {
                      const stats = usageStats.get(key.key);
                      return (
                        <div key={key.key} className="bg-gray-600/50 border border-gray-500 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{key.name}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                key.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {key.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleKey(key.key)}
                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-400 transition-colors"
                              >
                                {key.isActive ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => handleRemoveKey(key.key)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            <p>Key: {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}</p>
                            <p>Last used: {key.lastUsed ? key.lastUsed.toLocaleString() : 'Never'}</p>
                            {stats && (
                              <p>Requests: {stats.totalRequests} (Success: {stats.successfulRequests})</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Statistics */}
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Overall Statistics</h3>
                  <button
                    onClick={handleResetStats}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Reset Stats
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{overallStats.totalKeys}</p>
                    <p className="text-sm text-gray-400">Total Keys</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{overallStats.activeKeys}</p>
                    <p className="text-sm text-gray-400">Active Keys</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{overallStats.totalRequests}</p>
                    <p className="text-sm text-gray-400">Total Requests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{overallStats.successRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-400">Success Rate</p>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Detailed Statistics</h3>
                {usageStats.size === 0 ? (
                  <p className="text-gray-400 text-center py-4">No usage statistics available</p>
                ) : (
                  <div className="space-y-3">
                    {Array.from(usageStats.entries()).map(([key, stats]) => {
                      const apiKey = apiKeys.find(k => k.key === key);
                      return (
                        <div key={key} className="bg-gray-600/50 border border-gray-500 rounded-md p-3">
                          <h4 className="text-white font-medium mb-2">
                            {apiKey?.name || 'Unknown Key'}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Total:</span>
                              <span className="text-white ml-2">{stats.totalRequests}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Success:</span>
                              <span className="text-green-400 ml-2">{stats.successfulRequests}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Failed:</span>
                              <span className="text-red-400 ml-2">{stats.failedRequests}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Rate Limits:</span>
                              <span className="text-yellow-400 ml-2">{stats.rateLimitHits}</span>
                            </div>
                          </div>
                          {stats.lastError && (
                            <div className="mt-2 text-xs text-red-400">
                              Last Error: {stats.lastError}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiApiSettings;