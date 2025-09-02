import type { AnalysisResult } from '../types';
import { databaseService, type SessionHistoryRecord } from './databaseService';

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

const MAX_SESSIONS = 50; // Keep only the last 50 sessions

export async function saveSessionToHistory(
  prompt: string,
  strategy: string,
  analysisResult: AnalysisResult,
  customInstructions?: string
): Promise<void> {
  try {
    if (!prompt || !strategy || !analysisResult) {
      console.warn('Invalid parameters for saving session history');
      return;
    }

    const sessionRecord: SessionHistoryRecord = {
      id: generateSessionId(),
      timestamp: new Date(),
      prompt: String(prompt),
      strategy: String(strategy),
      analysis: String(analysisResult.analysis || ''),
      chartData: Array.isArray(analysisResult.chartData) ? analysisResult.chartData : [],
      sources: Array.isArray(analysisResult.sources) ? analysisResult.sources : undefined,
      customInstructions: customInstructions ? String(customInstructions) : undefined,
      createdAt: new Date()
    };

    // Save to database
    await databaseService.saveSessionHistory(sessionRecord);
    
    // Clean up old sessions (keep only the most recent MAX_SESSIONS)
    await cleanupOldSessions();
    
    console.log('Session saved to history:', sessionRecord.id);
  } catch (error) {
    console.error('Failed to save session to history:', error);
    // Fallback to localStorage
    await saveToLocalStorageFallback(prompt, strategy, analysisResult, customInstructions);
  }
}

export async function getSessionHistory(): Promise<SessionHistory> {
  try {
    const sessions = await databaseService.getSessionHistory(MAX_SESSIONS);
    
    const sessionHistoryItems: SessionHistoryItem[] = sessions.map(session => ({
      id: session.id,
      timestamp: session.timestamp,
      prompt: session.prompt,
      strategy: session.strategy,
      analysis: session.analysis,
      chartData: session.chartData,
      sources: session.sources,
      customInstructions: session.customInstructions
    }));

    return {
      sessions: sessionHistoryItems,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Failed to load session history from database:', error);
    // Fallback to localStorage
    return getFromLocalStorageFallback();
  }
}

export async function clearSessionHistory(): Promise<void> {
  try {
    await databaseService.clearSessionHistory();
    console.log('Session history cleared from database');
  } catch (error) {
    console.error('Failed to clear session history from database:', error);
    // Fallback to localStorage
    localStorage.removeItem('tradology_session_history');
    console.log('Session history cleared from localStorage');
  }
}

export async function deleteSessionFromHistory(sessionId: string): Promise<void> {
  try {
    await databaseService.deleteSessionHistory(sessionId);
    console.log('Session deleted from history:', sessionId);
  } catch (error) {
    console.error('Failed to delete session from history:', error);
    // Fallback to localStorage
    const history = getFromLocalStorageFallback();
    history.sessions = history.sessions.filter(session => session.id !== sessionId);
    history.lastUpdated = new Date();
    localStorage.setItem('tradology_session_history', JSON.stringify(history));
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

// Helper function to clean up old sessions
async function cleanupOldSessions(): Promise<void> {
  try {
    const allSessions = await databaseService.getSessionHistory(1000); // Get more than MAX_SESSIONS
    if (allSessions.length > MAX_SESSIONS) {
      // Sort by timestamp descending and keep only the most recent ones
      const sortedSessions = allSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const sessionsToDelete = sortedSessions.slice(MAX_SESSIONS);
      
      // Delete old sessions
      for (const session of sessionsToDelete) {
        await databaseService.deleteSessionHistory(session.id);
      }
      
      console.log(`Cleaned up ${sessionsToDelete.length} old sessions`);
    }
  } catch (error) {
    console.error('Failed to cleanup old sessions:', error);
  }
}

// Fallback methods for localStorage
async function saveToLocalStorageFallback(
  prompt: string,
  strategy: string,
  analysisResult: AnalysisResult,
  customInstructions?: string
): Promise<void> {
  try {
    const historyItem: SessionHistoryItem = {
      id: generateSessionId(),
      timestamp: new Date(),
      prompt,
      strategy,
      analysis: analysisResult.analysis,
      chartData: analysisResult.chartData || [],
      sources: analysisResult.sources,
      customInstructions
    };

    const existingHistory = getFromLocalStorageFallback();
    existingHistory.sessions.unshift(historyItem); // Add to beginning
    
    // Keep only the most recent sessions
    if (existingHistory.sessions.length > MAX_SESSIONS) {
      existingHistory.sessions = existingHistory.sessions.slice(0, MAX_SESSIONS);
    }
    
    existingHistory.lastUpdated = new Date();
    
    localStorage.setItem('tradology_session_history', JSON.stringify(existingHistory));
    console.log('Session saved to localStorage fallback:', historyItem.id);
  } catch (error) {
    console.error('Failed to save session to localStorage fallback:', error);
  }
}

function getFromLocalStorageFallback(): SessionHistory {
  try {
    const stored = localStorage.getItem('tradology_session_history');
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
    console.error('Failed to load session history from localStorage:', error);
  }
  
  return {
    sessions: [],
    lastUpdated: new Date()
  };
}