export const COMPETITOR_ANALYSIS_PROMPT = (target: string) => `
Analyze the competitive landscape for ${target}. Identify their top 5 competitors and provide the following information for each in JSON format:

{
  "targetCompany": "${target}",
  "competitors": [
    {
      "name": "competitor name",
      "strengths": ["strength1", "strength2", ...],
      "weaknesses": ["weakness1", "weakness2", ...],
      "marketPosition": "description of market position",
      "keyDifferentiators": ["differentiator1", "differentiator2", ...],
      "targetAudience": "description of target audience",
      "pricingModel": "description of pricing",
      "recentDevelopments": ["development1", "development2", ...]
    }
  ],
  "summary": "overall market analysis summary",
  "recommendations": ["recommendation1", "recommendation2", ...]
}

Provide comprehensive, factual analysis based on publicly available information.`;

export const NORMALIZATION_PROMPT = (data: any) => `
Normalize and clean the following competitor analysis data. Ensure consistent formatting, remove duplicates, fix any JSON errors, and standardize the structure. Return valid JSON matching this exact schema:

{
  "targetCompany": "string",
  "competitors": [
    {
      "name": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "marketPosition": "string",
      "keyDifferentiators": ["string"],
      "targetAudience": "string",
      "pricingModel": "string",
      "recentDevelopments": ["string"]
    }
  ],
  "summary": "string",
  "recommendations": ["string"]
}

Data to normalize:
${JSON.stringify(data)}`;