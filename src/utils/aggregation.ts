import { LLMResponse, Competitor, ComparisonCriteria } from '../types';

export function aggregateCompetitors(
  responses: LLMResponse[],
  normalized: Record<string, string>
): Competitor[] {
  // Count frequency of each competitor across all responses
  const frequencyMap = new Map<string, number>();
  
  responses.forEach(response => {
    if (response.competitors) {
      response.competitors.forEach(competitor => {
        const normalizedName = normalized[competitor] || competitor;
        const count = frequencyMap.get(normalizedName) || 0;
        frequencyMap.set(normalizedName, count + 1);
      });
    }
  });

  // Convert to array and sort by frequency
  const competitors: Competitor[] = Array.from(frequencyMap.entries())
    .map(([name, frequency]) => {
      // Determine entity type based on name format
      let type: 'company' | 'product' | 'brand' = 'company';
      let parent: string | undefined;
      
      // Check if it's in "Product (Company)" format
      const match = name.match(/^(.+)\s*\((.+)\)$/);
      if (match) {
        type = 'product';
        parent = match[2];
      }
      
      return {
        name,
        type,
        parent,
        frequency,
        normalizedName: name
      };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10) // Take top 10
    .map((competitor, index) => ({
      ...competitor,
      rank: index + 1
    }));

  return competitors;
}

export function aggregateCriteria(
  responses: LLMResponse[],
  normalized: Record<string, string>
): ComparisonCriteria[] {
  // Count frequency of each criteria across all responses
  const frequencyMap = new Map<string, { frequency: number; type?: string }>();
  
  responses.forEach(response => {
    if (response.criteria) {
      response.criteria.forEach(criterion => {
        const normalizedName = normalized[criterion] || criterion;
        const existing = frequencyMap.get(normalizedName) || { frequency: 0 };
        frequencyMap.set(normalizedName, {
          frequency: existing.frequency + 1,
          type: existing.type || inferCriteriaType(normalizedName)
        });
      });
    }
  });

  // Convert to array and sort by frequency
  const criteria: ComparisonCriteria[] = Array.from(frequencyMap.entries())
    .map(([name, data]) => ({
      name,
      type: (data.type || 'qualitative') as any,
      normalizedName: name,
      frequency: data.frequency,
      unit: inferUnit(name),
      scale: inferScale(name, data.type)
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10) // Take top 10
    .map((criterion, index) => ({
      ...criterion,
      rank: index + 1
    }));

  return criteria;
}

function inferCriteriaType(name: string): string {
  const lowercased = name.toLowerCase();
  
  // Quantitative indicators
  if (lowercased.includes('price') || 
      lowercased.includes('cost') || 
      lowercased.includes('weight') ||
      lowercased.includes('size') ||
      lowercased.includes('battery') ||
      lowercased.includes('range') ||
      lowercased.includes('speed')) {
    return 'quantitative';
  }
  
  // Binary indicators
  if (lowercased.includes('yes/no') ||
      lowercased.includes('available') ||
      lowercased.includes('support') ||
      lowercased.includes('wireless') ||
      lowercased.includes('waterproof')) {
    return 'binary';
  }
  
  // Categorical indicators
  if (lowercased.includes('type') ||
      lowercased.includes('category') ||
      lowercased.includes('style') ||
      lowercased.includes('color')) {
    return 'categorical';
  }
  
  // Default to qualitative
  return 'qualitative';
}

function inferUnit(name: string): string | undefined {
  const lowercased = name.toLowerCase();
  
  if (lowercased.includes('price') || lowercased.includes('cost')) return 'USD';
  if (lowercased.includes('weight')) return 'g';
  if (lowercased.includes('battery')) return 'hours';
  if (lowercased.includes('size')) return 'inches';
  if (lowercased.includes('speed')) return 'mph';
  if (lowercased.includes('range')) return 'miles';
  
  return undefined;
}

function inferScale(_name: string, type?: string): string | undefined {
  if (type === 'qualitative') {
    return '1-5';
  }
  return undefined;
} 