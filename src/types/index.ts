// Core data types for the comp_table application

export interface Entity {
    name: string;
    type: 'company' | 'product' | 'brand';
    parent?: string;
    normalizedName?: string;
  }
  
  export interface Competitor extends Entity {
    frequency: number;
    rank?: number;
    description?: string;
  }
  
  export interface ComparisonCriteria {
    name: string;
    type: 'quantitative' | 'binary' | 'qualitative' | 'categorical';
    unit?: string;
    scale?: string;
    normalizedName?: string;
    frequency: number;
    rank?: number;
  }

  export interface CellAnswer {
    company: string;
    criteria: string;
    answer: string;
    loading?: boolean;
    error?: boolean;
  }
  
  export interface CompetitorAnalysisResult {
    target: string;
    competitors: Competitor[];
    criteria: ComparisonCriteria[];
    table: (string | number | boolean | null)[][];
    cellAnswers?: Record<string, CellAnswer>;
    timestamp: Date;
    rawResponses?: {
      competitors: LLMResponse[];
      criteria: LLMResponse[];
    };
  }
  
  export interface LLMResponse {
    model: string;
    competitors?: string[];
    criteria?: string[];
    error?: string;
  }
  
  export interface APIConfig {
    openRouterApiKey: string;
    groqApiKey: string;
  }
  
  export interface NormalizationRequest {
    entities: string[];
    context: string;
    type: 'competitors' | 'criteria';
  }
  
  export interface NormalizationResponse {
    normalized: Record<string, string>;
    groups?: Record<string, string[]>;
  }

  export interface CompetitorDescription {
    company: string;
    description: string;
    loading?: boolean;
    error?: boolean;
  }