import { NormalizationRequest, NormalizationResponse } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'meta-llama/llama-4-scout-17b-16e-instruct') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async normalize(request: NormalizationRequest): Promise<NormalizationResponse> {
    const prompt = this.buildNormalizationPrompt(request);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a data normalization expert. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      
      return JSON.parse(content) as NormalizationResponse;
    } catch (error) {
      console.error('Normalization error:', error);
      // Return original entities as-is if normalization fails
      const fallback: NormalizationResponse = {
        normalized: {}
      };
      request.entities.forEach(entity => {
        fallback.normalized[entity] = entity;
      });
      return fallback;
    }
  }

  async getSpecificAnswer(company: string, criteria: string): Promise<string> {
    const prompt = `What is the ${criteria} for ${company}?

Give only the direct answer in 5 words or less. No explanation.

Examples:
- Tesla + Fuel Source = Electric
- Ferrari + Fuel Source = Petrol  
- iPhone + Operating System = iOS
- Sony WH-1000XM4 + Price = $300-400

Answer:`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Respond with only the factual answer. No reasoning, no explanation, no extra text. Maximum 5 words.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 15
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content || 'Unknown';
      
      // Clean up the response - remove any thinking tags, labels, or extra formatting
      content = content.replace(/<think>.*?<\/think>/gs, '');
      content = content.replace(/^(Answer:|A:|Response:|Answer only:)\s*/i, '');
      content = content.replace(/\n.*$/s, ''); // Remove anything after first line
      content = content.trim();
      
      // If still too long, take first 5 words
      const words = content.split(' ');
      if (words.length > 5) {
        content = words.slice(0, 5).join(' ');
      }
      
      return content || 'Unknown';
    } catch (error) {
      console.error('Specific answer error:', error);
      return 'Error';
    }
  }

  private buildNormalizationPrompt(request: NormalizationRequest): string {
    if (request.type === 'competitors') {
      return `
Normalize these competitor names for "${request.context}":
${JSON.stringify(request.entities)}

Rules:
1. Merge variations of the same entity (e.g., "Uber" and "UBER" → "Uber")
2. Use the format "Product (Company)" for specific products
3. Use just the brand/company name when no specific product is mentioned
4. Group related entities when appropriate

Return JSON in this format:
{
  "normalized": {
    "original_name": "normalized_name",
    ...
  },
  "groups": {
    "normalized_name": ["original_variant1", "original_variant2"],
    ...
  }
}`;
    } else {
      return `
Normalize these comparison criteria for "${request.context}":
${JSON.stringify(request.entities)}

Rules:
1. Merge synonyms (e.g., "Cost" and "Price" → "Price")
2. Standardize naming (e.g., "Battery" and "Battery Life" → "Battery Life")
3. Maintain clarity and specificity

Return JSON in this format:
{
  "normalized": {
    "original_criteria": "normalized_criteria",
    ...
  },
  "groups": {
    "normalized_criteria": ["original_variant1", "original_variant2"],
    ...
  }
}`;
    }
  }
}