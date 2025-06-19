import React, { useState } from 'react';
import { CompetitorAnalysisResult, CellAnswer } from '../types';
import { GroqClient } from '../api/groq';

interface CompetitorTableProps {
  result: CompetitorAnalysisResult;
  groqApiKey: string;
}

export const CompetitorTable: React.FC<CompetitorTableProps> = ({ result, groqApiKey }) => {
  const [cellAnswers, setCellAnswers] = useState<Record<string, CellAnswer>>(result.cellAnswers || {});
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

  const getCellKey = (competitorIndex: number, criteriaIndex: number) => 
    `${competitorIndex}-${criteriaIndex}`;

  const handleGetAnswer = async (competitorIndex: number, criteriaIndex: number) => {
    const competitor = result.competitors[competitorIndex];
    const criteria = result.criteria[criteriaIndex];
    const cellKey = getCellKey(competitorIndex, criteriaIndex);

    // Set loading state
    setLoadingCells(prev => new Set(prev).add(cellKey));

    try {
      const groqClient = new GroqClient(groqApiKey);
      const answer = await groqClient.getSpecificAnswer(competitor.name, criteria.name);

      const cellAnswer: CellAnswer = {
        company: competitor.name,
        criteria: criteria.name,
        answer,
        loading: false,
        error: false
      };

      setCellAnswers(prev => ({
        ...prev,
        [cellKey]: cellAnswer
      }));
    } catch (error) {
      console.error('Error getting specific answer:', error);
      const cellAnswer: CellAnswer = {
        company: competitor.name,
        criteria: criteria.name,
        answer: 'Error',
        loading: false,
        error: true
      };

      setCellAnswers(prev => ({
        ...prev,
        [cellKey]: cellAnswer
      }));
    } finally {
      setLoadingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  const renderCell = (competitorIndex: number, criteriaIndex: number) => {
    const cellKey = getCellKey(competitorIndex, criteriaIndex);
    const cellAnswer = cellAnswers[cellKey];
    const isLoading = loadingCells.has(cellKey);

    return (
      <td
        key={cellKey}
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative"
      >
        <div className="flex flex-col space-y-2">
          {/* Display answer if available */}
          {cellAnswer && (
            <div className={`text-sm font-medium ${
              cellAnswer.error ? 'text-red-600' : 'text-gray-900'
            }`}>
              {cellAnswer.answer}
            </div>
          )}
          
          {/* Button to get answer */}
          <button
            onClick={() => handleGetAnswer(competitorIndex, criteriaIndex)}
            disabled={isLoading}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : cellAnswer
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : cellAnswer ? (
              'Refresh'
            ) : (
              'Get Answer'
            )}
          </button>
        </div>
      </td>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Competitor Analysis: {result.target}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Generated on {result.timestamp.toLocaleString()}
        </p>
        <p className="text-xs text-blue-600 mt-2">
          💡 Click "Get Answer" in any cell to get specific information about that company and criteria
        </p>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
              Competitor
            </th>
            {result.criteria.map((criterion) => (
              <th
                key={criterion.name}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
              >
                <div>
                  <div>{criterion.name}</div>
                  {criterion.unit && (
                    <span className="text-gray-400 font-normal">({criterion.unit})</span>
                  )}
                  {criterion.scale && (
                    <span className="text-gray-400 font-normal">({criterion.scale})</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {result.competitors.map((competitor, rowIndex) => (
            <tr key={competitor.name} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                <div>
                  <div className="font-semibold">{competitor.name}</div>
                  <div className="text-xs text-gray-500">
                    {competitor.type} • Freq: {competitor.frequency}
                  </div>
                </div>
              </td>
              {result.criteria.map((_, colIndex) => renderCell(rowIndex, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Top Competitors</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            {result.competitors.slice(0, 5).map((comp, i) => (
              <li key={comp.name}>
                {i + 1}. {comp.name} (mentioned {comp.frequency} times)
              </li>
            ))}
          </ol>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Key Criteria</h3>
          <ol className="text-sm text-green-700 space-y-1">
            {result.criteria.slice(0, 5).map((crit, i) => (
              <li key={crit.name}>
                {i + 1}. {crit.name} ({crit.type})
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}; 