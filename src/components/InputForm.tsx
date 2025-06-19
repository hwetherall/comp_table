import React, { useState } from 'react';

interface InputFormProps {
  onSubmit: (target: string) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [target, setTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (target.trim()) {
      onSubmit(target.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Competitor Analysis Table
        </h1>
        <p className="text-gray-600 mb-6">
          Enter a product or company to generate an AI-powered competitor analysis
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
              Target Entity
            </label>
            <input
              id="target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., Bose Headphones, Tesla Model 3, Slack"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !target.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Generate Analysis'}
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Queries 9 different LLMs for competitors and comparison criteria</li>
            <li>2. Normalizes and deduplicates the responses</li>
            <li>3. Generates a 10x10 table structure with the most relevant data</li>
          </ol>
        </div>
      </div>
    </form>
  );
};