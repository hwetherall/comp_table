import React from 'react';

interface LoadingStateProps {
  stage: 'idle' | 'fetching' | 'normalizing' | 'complete';
  message: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ stage, message }) => {
  if (stage === 'idle') return null;

  const getStageIcon = () => {
    switch (stage) {
      case 'fetching':
        return '🔍';
      case 'normalizing':
        return '🔧';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'fetching':
        return 'bg-blue-100 text-blue-800';
      case 'normalizing':
        return 'bg-yellow-100 text-yellow-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={`rounded-lg p-6 ${getStageColor()}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStageIcon()}</span>
          <div className="flex-1">
            <h3 className="font-semibold capitalize">{stage}</h3>
            <p className="text-sm mt-1">{message}</p>
          </div>
          {stage !== 'complete' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
          )}
        </div>
        
        {stage === 'fetching' && (
          <div className="mt-4 space-y-2">
            <div className="text-sm">Querying models:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['Claude', 'Gemini', 'Llama', 'Mistral', 'Qwen', 'Phi'].map((model) => (
                <div key={model} className="bg-white bg-opacity-50 rounded px-2 py-1">
                  {model}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};