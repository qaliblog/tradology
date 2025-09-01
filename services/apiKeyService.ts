const API_KEY_STORAGE_KEY = 'gemini_api_key';

/**
 * Get the stored API key from localStorage
 */
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get API key from localStorage:', error);
    return null;
  }
}

/**
 * Set the API key in localStorage
 */
export function setApiKey(apiKey: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Failed to save API key to localStorage:', error);
    throw new Error('Failed to save API key');
  }
}

/**
 * Clear the stored API key from localStorage
 */
export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear API key from localStorage:', error);
  }
}

/**
 * Check if an API key is available (either from localStorage or environment)
 */
export function hasApiKey(): boolean {
  const manualKey = getApiKey();
  const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return !!(manualKey || envKey);
}

/**
 * Get the effective API key (manual key takes precedence over environment key)
 */
export function getEffectiveApiKey(): string | null {
  const manualKey = getApiKey();
  if (manualKey) {
    return manualKey;
  }
  
  return process.env.API_KEY || process.env.GEMINI_API_KEY || null;
}