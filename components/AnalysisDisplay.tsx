
import React from 'react';

interface AnalysisDisplayProps {
  analysis: string;
  sources?: { uri: string; title: string; }[];
}

// A simple utility to convert markdown-like text to HTML
const formatAnalysis = (text: string) => {
    if (!text || typeof text !== 'string') {
        return 'No analysis content available.';
    }
    
    try {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300">$1</strong>') // Bold
            .replace(/\n/g, '<br />'); // Newlines
    } catch (error) {
        console.error('Error formatting analysis text:', error);
        return 'Error formatting analysis content.';
    }
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, sources }) => {
  // Add error boundary and validation
  if (!analysis) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">AI Technical Analysis</h2>
        <p className="text-gray-400">No analysis data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">AI Technical Analysis</h2>
      <div
        className="prose prose-invert prose-p:text-gray-300 prose-li:text-gray-300 text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
      />
      
      {sources && sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Sources</h3>
            <ul className="space-y-2">
                {sources.map((source, index) => (
                    <li key={index} className="flex items-center">
                        <span className="text-gray-500 mr-2">{index + 1}.</span>
                        <a 
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                            title={source.title}
                        >
                            {source.title || (() => {
                                try {
                                    return new URL(source.uri).hostname;
                                } catch {
                                    return source.uri;
                                }
                            })()}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
