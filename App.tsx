
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import DataTable from './components/DataTable';
import AnalysisDisplay from './components/AnalysisDisplay';
import LineChart from './components/LineChart';
import { getTradingAnalysis } from './services/geminiService';
import type { AnalysisResult } from './types';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisRequest = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError("Please enter a URL or query.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // The service now returns a structured object with analysis and data
      const result = await getTradingAnalysis(prompt);
      
      setAnalysisResult({
        analysis: result.analysis,
        chartData: result.chartData,
        prompt: prompt,
        sources: result.sources,
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-400 mb-6">
            Enter a URL or a query like "Analyze NVDA stock price today" for a detailed AI analysis and recent historical data.
          </p>
          <SearchBar 
            onSearch={handleAnalysisRequest} 
            isLoading={isLoading} 
          />
          
          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center mt-8 text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              <p className="mt-4 text-lg">AI is searching the web and analyzing data...</p>
            </div>
          )}

          {analysisResult && (
            <div className="mt-8 space-y-8">
              {analysisResult.chartData && analysisResult.chartData.length > 0 && (
                <LineChart data={analysisResult.chartData} />
              )}
              <DataTable 
                data={analysisResult.chartData} 
                prompt={analysisResult.prompt} 
              />
              <AnalysisDisplay analysis={analysisResult.analysis} sources={analysisResult.sources} />
            </div>
          )}
          
          {!isLoading && !analysisResult && !error && (
             <div className="mt-12 text-center text-gray-500">
              <p className="text-xl">Ready to analyze the markets for you.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;