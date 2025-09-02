import React, { useState, useEffect } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '../services/apiKeyService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMultiApi?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenMultiApi }) => {
  const [apiKey, setApiKeyValue] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Load current API key when modal opens
      const currentKey = getApiKey();
      setApiKeyValue(currentKey || '');
      setValidationMessage('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setValidationMessage('Please enter a valid API key');
      return;
    }

    setIsValidating(true);
    setValidationMessage('');

    try {
      // Save the API key
      setApiKey(apiKey.trim());
      setValidationMessage('API key saved successfully!');
      
      // Clear the success message after 2 seconds
      setTimeout(() => {
        setValidationMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      setValidationMessage('Failed to save API key');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setApiKeyValue('');
    setValidationMessage('API key cleared');
    
    setTimeout(() => {
      setValidationMessage('');
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter your Gemini API key"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your API key is stored locally in your browser and never shared.
            </p>
          </div>

          {validationMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              validationMessage.includes('success') || validationMessage.includes('cleared')
                ? 'bg-green-900/50 text-green-300 border border-green-700'
                : 'bg-red-900/50 text-red-300 border border-red-700'
            }`}>
              {validationMessage}
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={onOpenMultiApi}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Multi-API Settings
            </button>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Configure multiple API keys for automatic cycling and rate limit handling
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isValidating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleClear}
              disabled={isValidating}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              disabled={isValidating}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;