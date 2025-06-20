import React from 'react';
import { LLMResponse } from '../types';

interface RawOutcomesTableProps {
  target: string;
  competitorResponses: LLMResponse[];
  criteriaResponses: LLMResponse[];
}

export const RawOutcomesTable: React.FC<RawOutcomesTableProps> = ({ 
  target, 
  competitorResponses, 
  criteriaResponses 
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Raw LLM Outcomes: {target}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Showing raw responses from each LLM before normalization and aggregation
        </p>
      </div>

      {/* Competitors Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-blue-50 border-b border-gray-200">
          Competitors from Each LLM
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LLM Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competitors Found
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitorResponses.map((response, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {response.model.split('/').pop() || response.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {response.error ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Success
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {response.error ? (
                      <span className="text-red-600 text-xs">{response.error}</span>
                    ) : response.competitors ? (
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {response.competitors.map((competitor, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {competitor}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {response.competitors.length} competitors
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No competitors found</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Criteria Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-green-50 border-b border-gray-200">
          Criteria from Each LLM
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LLM Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criteria Found
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {criteriaResponses.map((response, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {response.model.split('/').pop() || response.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {response.error ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Success
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {response.error ? (
                      <span className="text-red-600 text-xs">{response.error}</span>
                    ) : response.criteria ? (
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {response.criteria.map((criterion, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {criterion}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {response.criteria.length} criteria
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No criteria found</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Competitor Stats</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Total LLMs queried: {competitorResponses.length}</div>
            <div>Successful responses: {competitorResponses.filter(r => !r.error).length}</div>
            <div>Failed responses: {competitorResponses.filter(r => r.error).length}</div>
            <div>
              Total unique competitors: {
                Array.from(new Set(
                  competitorResponses
                    .filter(r => r.competitors)
                    .flatMap(r => r.competitors!)
                )).length
              }
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Criteria Stats</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>Total LLMs queried: {criteriaResponses.length}</div>
            <div>Successful responses: {criteriaResponses.filter(r => !r.error).length}</div>
            <div>Failed responses: {criteriaResponses.filter(r => r.error).length}</div>
            <div>
              Total unique criteria: {
                Array.from(new Set(
                  criteriaResponses
                    .filter(r => r.criteria)
                    .flatMap(r => r.criteria!)
                )).length
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 