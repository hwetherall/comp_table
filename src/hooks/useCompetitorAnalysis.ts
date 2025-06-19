import { useState, useCallback } from 'react';
import { CompetitorAnalysisResult } from '../types';
import { OpenRouterClient } from '../api/openrouter';
import { GroqClient } from '../api/groq';
import { aggregateCompetitors, aggregateCriteria } from '../utils/aggregation';

interface UseCompetitorAnalysisProps {
  openRouterApiKey: string;
  groqApiKey: string;
}

interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: CompetitorAnalysisResult | null;
  progress: {
    stage: 'idle' | 'fetching' | 'normalizing' | 'complete';
    message: string;
  };
}

export function useCompetitorAnalysis({ 
  openRouterApiKey, 
  groqApiKey 
}: UseCompetitorAnalysisProps) {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
    progress: {
      stage: 'idle',
      message: ''
    }
  });

  const analyze = useCallback(async (target: string) => {
    setState({
      isLoading: true,
      error: null,
      result: null,
      progress: {
        stage: 'fetching',
        message: 'Querying multiple LLMs for competitors and criteria...'
      }
    });

    try {
      const openRouterClient = new OpenRouterClient(openRouterApiKey);
      const groqClient = new GroqClient(groqApiKey);

      // Step 1: Get competitors and criteria from multiple LLMs
      const [competitorResponses, criteriaResponses] = await Promise.all([
        openRouterClient.getCompetitors(target),
        openRouterClient.getCriteria(target)
      ]);

      // Extract all unique entities for normalization
      const allCompetitors = competitorResponses
        .flatMap(r => r.competitors || [])
        .filter((v, i, a) => a.indexOf(v) === i);
      
      const allCriteria = criteriaResponses
        .flatMap(r => r.criteria || [])
        .filter((v, i, a) => a.indexOf(v) === i);

      setState(prev => ({
        ...prev,
        progress: {
          stage: 'normalizing',
          message: 'Normalizing and deduplicating results...'
        }
      }));

      // Step 2: Normalize entities
      const [competitorNormalization, criteriaNormalization] = await Promise.all([
        groqClient.normalize({
          entities: allCompetitors,
          context: target,
          type: 'competitors'
        }),
        groqClient.normalize({
          entities: allCriteria,
          context: target,
          type: 'criteria'
        })
      ]);

      // Step 3: Aggregate and rank
      const competitors = aggregateCompetitors(
        competitorResponses, 
        competitorNormalization.normalized
      );
      
      const criteria = aggregateCriteria(
        criteriaResponses, 
        criteriaNormalization.normalized
      );

      // Step 4: Create empty table structure
      const table: (string | number | boolean | null)[][] = 
        Array(competitors.length).fill(null).map(() => 
          Array(criteria.length).fill(null)
        );

      const result: CompetitorAnalysisResult = {
        target,
        competitors,
        criteria,
        table,
        timestamp: new Date(),
        rawResponses: {
          competitors: competitorResponses,
          criteria: criteriaResponses
        }
      };

      setState({
        isLoading: false,
        error: null,
        result,
        progress: {
          stage: 'complete',
          message: 'Analysis complete!'
        }
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        isLoading: false,
        error: errorMessage,
        result: null,
        progress: {
          stage: 'idle',
          message: ''
        }
      });
      throw error;
    }
  }, [openRouterApiKey, groqApiKey]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      result: null,
      progress: {
        stage: 'idle',
        message: ''
      }
    });
  }, []);

  return {
    ...state,
    analyze,
    reset
  };
}