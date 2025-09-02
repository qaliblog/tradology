import type { AnalysisResult } from '../types';

export interface SessionHistoryItem {
  id: string;
  timestamp: Date;
  prompt: string;
  strategy: string;
  analysis: string;
  chartData: any[];
  sources?: { uri: string; title: string; }[];
  customInstructions?: string;
}

export interface SessionHistory {
  sessions: SessionHistoryItem[];
  lastUpdated: Date;
}

const STORAGE_KEY = 'tradology_session_history';
const MAX_SESSIONS = 50; // Keep only the last 50 sessions

export function saveSessionToHistory(
  prompt: string,
  strategy: string,
  analysisResult: AnalysisResult,
  customInstructions?: string
): void {
  try {
    if (!prompt || !strategy || !analysisResult) {
      console.warn('Invalid parameters for saving session history');
      return;
    }

    const historyItem: SessionHistoryItem = {
      id: generateSessionId(),
      timestamp: new Date(),
      prompt: String(prompt),
      strategy: String(strategy),
      analysis: String(analysisResult.analysis || ''),
      chartData: Array.isArray(analysisResult.chartData) ? analysisResult.chartData : [],
      sources: Array.isArray(analysisResult.sources) ? analysisResult.sources : undefined,
      customInstructions: customInstructions ? String(customInstructions) : undefined
    };

    const existingHistory = getSessionHistory();
    existingHistory.sessions.unshift(historyItem); // Add to beginning
    
    // Keep only the most recent sessions
    if (existingHistory.sessions.length > MAX_SESSIONS) {
      existingHistory.sessions = existingHistory.sessions.slice(0, MAX_SESSIONS);
    }
    
    existingHistory.lastUpdated = new Date();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingHistory));
    console.log('Session saved to history:', historyItem.id);
  } catch (error) {
    console.error('Failed to save session to history:', error);
  }
}

export function getSessionHistory(): SessionHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      parsed.sessions = parsed.sessions.map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp)
      }));
      parsed.lastUpdated = new Date(parsed.lastUpdated);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load session history:', error);
  }
  
  return {
    sessions: [],
    lastUpdated: new Date()
  };
}

export function clearSessionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Session history cleared');
  } catch (error) {
    console.error('Failed to clear session history:', error);
  }
}

export function deleteSessionFromHistory(sessionId: string): void {
  try {
    const history = getSessionHistory();
    history.sessions = history.sessions.filter(session => session.id !== sessionId);
    history.lastUpdated = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    console.log('Session deleted from history:', sessionId);
  } catch (error) {
    console.error('Failed to delete session from history:', error);
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTimestamp(timestamp: Date): string {
  if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
    return 'Unknown';
  }
  
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  
  if (diff < 0) return 'Just now'; // Future timestamp
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
}