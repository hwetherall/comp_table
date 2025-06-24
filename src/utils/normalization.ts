import { AnalysisResult } from '../types';

export const normalizeData = (data: any): AnalysisResult => {
  try {
    // Basic validation and normalization
    return {
      targetCompany: data.targetCompany || '',
      competitors: (data.competitors || []).map((comp: any) => ({
        name: comp.name || '',
        strengths: Array.isArray(comp.strengths) ? comp.strengths : [],
        weaknesses: Array.isArray(comp.weaknesses) ? comp.weaknesses : [],
        marketPosition: comp.marketPosition || '',
        keyDifferentiators: Array.isArray(comp.keyDifferentiators) ? comp.keyDifferentiators : [],
        targetAudience: comp.targetAudience || '',
        pricingModel: comp.pricingModel || '',
        recentDevelopments: Array.isArray(comp.recentDevelopments) ? comp.recentDevelopments : []
      })),
      summary: data.summary || '',
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : []
    };
  } catch (error) {
    throw new Error('Failed to normalize data structure');
  }
};
