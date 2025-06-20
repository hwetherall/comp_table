import React, { useState } from 'react';
import { CompetitorAnalysisResult, CellAnswer, CompetitorDescription } from '../types';
import { GroqClient } from '../api/groq';
import * as XLSX from 'xlsx';

interface CompetitorTableProps {
  result: CompetitorAnalysisResult;
  groqApiKey: string;
}

export const CompetitorTable: React.FC<CompetitorTableProps> = ({ result, groqApiKey }) => {
  const [cellAnswers, setCellAnswers] = useState<Record<string, CellAnswer>>(result.cellAnswers || {});
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
  const [competitorDescriptions, setCompetitorDescriptions] = useState<Record<string, CompetitorDescription>>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState<Set<string>>(new Set());
  const [isFillAllLoading, setIsFillAllLoading] = useState(false);
  const [fillAllProgress, setFillAllProgress] = useState({ current: 0, total: 0 });

  const getCellKey = (competitorIndex: number, criteriaIndex: number) => 
    `${competitorIndex}-${criteriaIndex}`;

  const handleFillAll = async () => {
    setIsFillAllLoading(true);
    const groqClient = new GroqClient(groqApiKey);

    // Calculate total operations
    const totalDescriptions = result.competitors.length;
    const totalCells = result.competitors.length * result.criteria.length;
    const totalOperations = totalDescriptions + totalCells;
    
    setFillAllProgress({ current: 0, total: totalOperations });
    let completed = 0;

    try {
      // First, get all descriptions
      const descriptionPromises = result.competitors.map(async (competitor) => {
        const competitorKey = competitor.name;
        
        // Skip if already have description
        if (competitorDescriptions[competitorKey]) {
          completed++;
          setFillAllProgress({ current: completed, total: totalOperations });
          return;
        }

        try {
          const description = await groqClient.getCompetitorDescription(competitor.name, result.target);
          
          const competitorDescription: CompetitorDescription = {
            company: competitor.name,
            description,
            loading: false,
            error: false
          };

          setCompetitorDescriptions(prev => ({
            ...prev,
            [competitorKey]: competitorDescription
          }));
        } catch (error) {
          console.error(`Error getting description for ${competitor.name}:`, error);
          const competitorDescription: CompetitorDescription = {
            company: competitor.name,
            description: 'Error loading description',
            loading: false,
            error: true
          };

          setCompetitorDescriptions(prev => ({
            ...prev,
            [competitorKey]: competitorDescription
          }));
        }
        
        completed++;
        setFillAllProgress({ current: completed, total: totalOperations });
      });

      // Then, get all cell answers
      const cellPromises = result.competitors.flatMap((competitor, competitorIndex) => 
        result.criteria.map(async (criteria, criteriaIndex) => {
          const cellKey = getCellKey(competitorIndex, criteriaIndex);
          
          // Skip if already have answer
          if (cellAnswers[cellKey]) {
            completed++;
            setFillAllProgress({ current: completed, total: totalOperations });
            return;
          }

          try {
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
            console.error(`Error getting answer for ${competitor.name} - ${criteria.name}:`, error);
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
          }
          
          completed++;
          setFillAllProgress({ current: completed, total: totalOperations });
        })
      );

      // Execute all promises with some concurrency control to avoid rate limits
      // Process descriptions first, then cells, with batching
      const batchSize = 5;
      
      // Process descriptions in batches
      for (let i = 0; i < descriptionPromises.length; i += batchSize) {
        const batch = descriptionPromises.slice(i, i + batchSize);
        await Promise.allSettled(batch);
        // Small delay between batches to respect rate limits
        if (i + batchSize < descriptionPromises.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Process cells in batches
      for (let i = 0; i < cellPromises.length; i += batchSize) {
        const batch = cellPromises.slice(i, i + batchSize);
        await Promise.allSettled(batch);
        // Small delay between batches to respect rate limits
        if (i + batchSize < cellPromises.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('Error in fill all operation:', error);
    } finally {
      setIsFillAllLoading(false);
      setFillAllProgress({ current: 0, total: 0 });
    }
  };

  const handleGetDescription = async (competitorIndex: number) => {
    const competitor = result.competitors[competitorIndex];
    const competitorKey = competitor.name;

    // Set loading state
    setLoadingDescriptions(prev => new Set(prev).add(competitorKey));

    try {
      const groqClient = new GroqClient(groqApiKey);
      const description = await groqClient.getCompetitorDescription(competitor.name, result.target);

      const competitorDescription: CompetitorDescription = {
        company: competitor.name,
        description,
        loading: false,
        error: false
      };

      setCompetitorDescriptions(prev => ({
        ...prev,
        [competitorKey]: competitorDescription
      }));
    } catch (error) {
      console.error('Error getting competitor description:', error);
      const competitorDescription: CompetitorDescription = {
        company: competitor.name,
        description: 'Error loading description',
        loading: false,
        error: true
      };

      setCompetitorDescriptions(prev => ({
        ...prev,
        [competitorKey]: competitorDescription
      }));
    } finally {
      setLoadingDescriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(competitorKey);
        return newSet;
      });
    }
  };

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

  const handleExportToExcel = () => {
    // Create headers
    const headers = ['Competitor', 'Type', 'Frequency', 'Description', ...result.criteria.map(c => c.name)];
    
    // Create data rows
    const data = result.competitors.map((competitor, competitorIndex) => {
      const row: any[] = [
        competitor.name,
        competitor.type,
        competitor.frequency,
        competitorDescriptions[competitor.name]?.description || 'Not loaded'
      ];
      
      // Add cell answers for each criteria
      result.criteria.forEach((_, criteriaIndex) => {
        const cellKey = getCellKey(competitorIndex, criteriaIndex);
        const cellAnswer = cellAnswers[cellKey];
        row.push(cellAnswer?.answer || 'Not loaded');
      });
      
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // Competitor
      { wch: 10 }, // Type
      { wch: 10 }, // Frequency
      { wch: 40 }, // Description
      ...result.criteria.map(() => ({ wch: 15 })) // Criteria columns
    ];
    ws['!cols'] = colWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Competitor Analysis');

    // Add a summary sheet
    const summaryData = [
      ['Competitor Analysis Summary'],
      ['Target Company:', result.target],
      ['Generated:', result.timestamp.toLocaleString()],
      ['Total Competitors:', result.competitors.length],
      ['Total Criteria:', result.criteria.length],
      [''],
      ['Top Competitors:'],
      ...result.competitors.slice(0, 5).map((comp, i) => [
        `${i + 1}. ${comp.name}`,
        `Mentioned ${comp.frequency} times`
      ]),
      [''],
      ['Key Criteria:'],
      ...result.criteria.slice(0, 5).map((crit, i) => [
        `${i + 1}. ${crit.name}`,
        `Type: ${crit.type}`
      ])
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `competitor-analysis-${result.target.replace(/\s+/g, '-')}-${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const renderDescriptionCell = (competitorIndex: number) => {
    const competitor = result.competitors[competitorIndex];
    const competitorKey = competitor.name;
    const description = competitorDescriptions[competitorKey];
    const isLoading = loadingDescriptions.has(competitorKey);

    return (
      <td
        key={`description-${competitorIndex}`}
        className="px-6 py-4 text-sm text-gray-500 min-w-[200px] max-w-[300px]"
      >
        <div className="flex flex-col space-y-2">
          {/* Display description if available */}
          {description && (
            <div className={`text-sm ${
              description.error ? 'text-red-600' : 'text-gray-700'
            }`}>
              {description.description}
            </div>
          )}
          
          {/* Button to get description */}
          <button
            onClick={() => handleGetDescription(competitorIndex)}
            disabled={isLoading || isFillAllLoading}
            className={`px-3 py-1 text-xs rounded-md transition-colors self-start ${
              isLoading || isFillAllLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : description
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : isFillAllLoading ? (
              'Filling All...'
            ) : description ? (
              'Refresh'
            ) : (
              'Get Description'
            )}
          </button>
        </div>
      </td>
    );
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
            disabled={isLoading || isFillAllLoading}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              isLoading || isFillAllLoading
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
            ) : isFillAllLoading ? (
              'Filling All...'
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
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-blue-600">
            💡 Click "Get Description" to learn about each competitor, or "Get Answer" in any cell for specific information
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleExportToExcel}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              📊 Export to Excel
            </button>
            <button
              onClick={handleFillAll}
              disabled={isFillAllLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isFillAllLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isFillAllLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                  <span>
                    Filling All ({fillAllProgress.current}/{fillAllProgress.total})
                  </span>
                </div>
              ) : (
                'Fill All Answers'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
              Competitor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
              Description
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
              {renderDescriptionCell(rowIndex)}
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