import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { LoadingState } from './components/LoadingState';
import { CompetitorTable } from './components/CompetitorTable';
import { RawOutcomesTable } from './components/RawOutcomesTable';
import { useCompetitorAnalysis } from './hooks/useCompetitorAnalysis';
import './App.css';

function App() {
  // Load API keys from environment variables or use empty strings as fallback
  const envOpenRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  const envGroqKey = import.meta.env.VITE_GROQ_API_KEY || '';

  // Initialize with environment variables and determine if we should show API key form
  const [apiKeys, setApiKeys] = useState({
    openRouter: envOpenRouterKey,
    groq: envGroqKey
  });
  
  // Only show API keys form if both environment variables are not available
  const [showApiKeys, setShowApiKeys] = useState(!(envOpenRouterKey && envGroqKey));
  const [viewMode, setViewMode] = useState<'normalized' | 'raw'>('normalized');

  // Debug logging to help troubleshoot (remove in production)
  useEffect(() => {
    console.log('Environment variables check:');
    console.log('VITE_OPENROUTER_API_KEY:', envOpenRouterKey ? `Set (${envOpenRouterKey.substring(0, 10)}...)` : 'Not set');
    console.log('VITE_GROQ_API_KEY:', envGroqKey ? `Set (${envGroqKey.substring(0, 10)}...)` : 'Not set');
    console.log('Show API keys form:', !(envOpenRouterKey && envGroqKey));
    console.log('API Keys State:', {
      openRouter: apiKeys.openRouter ? `Set (${apiKeys.openRouter.substring(0, 10)}...)` : 'Not set',
      groq: apiKeys.groq ? `Set (${apiKeys.groq.substring(0, 10)}...)` : 'Not set'
    });
  }, [envOpenRouterKey, envGroqKey, apiKeys]);

  const { isLoading, error, result, progress, analyze, reset } = useCompetitorAnalysis({
    openRouterApiKey: apiKeys.openRouter,
    groqApiKey: apiKeys.groq
  });

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeys.openRouter && apiKeys.groq) {
      setShowApiKeys(false);
    }
  };

  const handleUseStoredKeys = () => {
    // Keys are already loaded, just hide the form
    setShowApiKeys(false);
  };

  const handleAnalyze = async (target: string) => {
    try {
      await analyze(target);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  if (showApiKeys) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">API Configuration</h1>
            <p className="text-gray-600 mb-6">
              Enter your API keys to get started. You'll need accounts with both OpenRouter and Groq.
            </p>
            
            {/* Show "Use Stored Keys" button if environment variables are available */}
            {envOpenRouterKey && envGroqKey && (
              <div className="mb-6">
                <button
                  onClick={handleUseStoredKeys}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  🔑 Use Stored Keys
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  API keys found in environment variables
                </p>
              </div>
            )}
            
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <label htmlFor="openrouter" className="block text-sm font-medium text-gray-700 mb-2">
                  OpenRouter API Key
                </label>
                <input
                  id="openrouter"
                  type="password"
                  value={apiKeys.openRouter}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openRouter: e.target.value }))}
                  placeholder="sk-or-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {envOpenRouterKey && (
                  <p className="text-xs text-green-600 mt-1">✓ Key loaded from environment</p>
                )}
              </div>
              
              <div>
                <label htmlFor="groq" className="block text-sm font-medium text-gray-700 mb-2">
                  Groq API Key
                </label>
                <input
                  id="groq"
                  type="password"
                  value={apiKeys.groq}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, groq: e.target.value }))}
                  placeholder="gsk_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {envGroqKey && (
                  <p className="text-xs text-green-600 mt-1">✓ Key loaded from environment</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Get API Keys:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter</a> - For multiple LLM access</li>
                <li>• <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="underline">Groq</a> - For fast normalization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {!result && (
          <InputForm onSubmit={handleAnalyze} isLoading={isLoading} />
        )}
        
        {isLoading && (
          <LoadingState stage={progress.stage} message={progress.message} />
        )}
        
        {error && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <span className="text-red-400 mr-3">❌</span>
                <div>
                  <h3 className="text-red-800 font-semibold">Analysis Failed</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <button
                    onClick={reset}
                    className="mt-3 text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {result && (
          <div className="space-y-4">
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={reset}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                New Analysis
              </button>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex rounded-md border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('normalized')}
                    className={`px-4 py-2 text-sm font-medium ${
                      viewMode === 'normalized'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Normalized Table
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-4 py-2 text-sm font-medium ${
                      viewMode === 'raw'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Raw LLM Outcomes
                  </button>
                </div>
              </div>
            </div>
            
            {viewMode === 'normalized' ? (
              <CompetitorTable result={result} groqApiKey={apiKeys.groq} />
            ) : (
              result.rawResponses && (
                <RawOutcomesTable 
                  target={result.target}
                  competitorResponses={result.rawResponses.competitors}
                  criteriaResponses={result.rawResponses.criteria}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;