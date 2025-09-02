import React, { useState, useEffect } from 'react';
import { 
  getSessionHistory, 
  clearSessionHistory, 
  deleteSessionFromHistory, 
  formatTimestamp,
  type SessionHistoryItem 
} from '../services/sessionHistoryService';

interface SessionHistoryProps {
  onLoadSession: (session: SessionHistoryItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ onLoadSession, isOpen, onClose }) => {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = () => {
    setIsLoading(true);
    try {
      const history = getSessionHistory();
      setSessions(history.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = (session: SessionHistoryItem) => {
    onLoadSession(session);
    onClose();
  };

  const handleDeleteSession = (sessionId: string) => {
    try {
      deleteSessionFromHistory(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all session history?')) {
      try {
        clearSessionHistory();
        setSessions([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Session History</h2>
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              disabled={sessions.length === 0}
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No session history found.</p>
              <p className="text-sm mt-2">Your analysis sessions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate" title={session.prompt}>
                        {session.prompt}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span>Strategy: {session.strategy}</span>
                        <span>•</span>
                        <span>{formatTimestamp(session.timestamp)}</span>
                        {session.chartData.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{session.chartData.length} data points</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleLoadSession(session)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Preview of analysis */}
                  <div className="text-sm text-gray-300 line-clamp-2">
                    {session.analysis.substring(0, 200)}
                    {session.analysis.length > 200 && '...'}
                  </div>
                  
                  {/* Sources preview */}
                  {session.sources && session.sources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Sources: {session.sources.length} found
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400 text-center">
          {sessions.length > 0 && (
            <p>Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;