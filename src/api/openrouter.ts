import { LLMResponse } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// List of models to use for crowdsourcing
export const LLM_MODELS = [
  'anthropic/claude-sonnet-4',
  'google/gemini-2.5-flash-lite-preview-06-17',
  'openai/gpt-4.1-mini',
  'deepseek/deepseek-chat-v3-0324',
  'qwen/qwen-2.5-7b-instruct',
  'perplexity/sonar',
  'openai/gpt-4o-mini-search-preview'];

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export class OpenRouterClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async callLLM(
    model: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    try {
      const messages: OpenRouterMessage[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      console.log(`Calling ${model}...`);
      
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'comp_table'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 500
        } as OpenRouterRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call failed for ${model}:`, response.status, errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Raw response from ${model}:`, data);
      
      const content = data.choices[0]?.message?.content || '';
      console.log(`Content from ${model}:`, content);
      
      // Parse the response based on content
      const parsedResponse = this.parseResponse(content);
      console.log(`Parsed response from ${model}:`, parsedResponse);
      
      return {
        model,
        ...parsedResponse
      };
    } catch (error) {
      console.error(`Error calling ${model}:`, error);
      return {
        model,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseResponse(content: string): Partial<LLMResponse> {
    console.log('Parsing content:', content);
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      console.log('Successfully parsed as JSON:', parsed);
      return {
        competitors: parsed.competitors || undefined,
        criteria: parsed.criteria || undefined
      };
    } catch (jsonError) {
      console.log('Not valid JSON, trying text parsing...');
      
      // Clean the content - remove markdown formatting, extra whitespace
      const cleanedContent = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s+|\s+$/g, '');
      
      // Try parsing cleaned content as JSON
      try {
        const parsed = JSON.parse(cleanedContent);
        console.log('Successfully parsed cleaned content as JSON:', parsed);
        return {
          competitors: parsed.competitors || undefined,
          criteria: parsed.criteria || undefined
        };
      } catch (cleanedJsonError) {
        console.log('Still not JSON, extracting from text...');
        
        // Extract lists from text using multiple patterns
        const lines = content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        // Try different list patterns
        const listPatterns = [
          /^[-•*]\s*(.+)$/,  // Bullet points
          /^\d+\.\s*(.+)$/,  // Numbered lists
          /^(\d+)\)\s*(.+)$/, // Numbered with parentheses
          /^["\']([^"']+)["\']$/, // Quoted items
        ];
        
        const items: string[] = [];
        
        for (const line of lines) {
          let matched = false;
          for (const pattern of listPatterns) {
            const match = line.match(pattern);
            if (match) {
              const item = (match[1] || match[2] || '').trim();
              if (item && item.length > 0) {
                items.push(item);
                matched = true;
                break;
              }
            }
          }
          
          // If no pattern matched but line looks like an item, add it
          if (!matched && line.length > 2 && !line.includes(':')) {
            items.push(line);
          }
        }
        
        console.log('Extracted items from text:', items);
        
        if (items.length === 0) {
          console.log('No items found, returning error');
          return { error: 'Could not parse response - no items found' };
        }
        
        // Determine if this is competitors or criteria based on content
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('competitor') || 
            lowerContent.includes('compet') ||
            lowerContent.includes('alternative') ||
            lowerContent.includes('rival')) {
          console.log('Detected as competitors');
          return { competitors: items };
        } else if (lowerContent.includes('criteri') || 
                   lowerContent.includes('feature') ||
                   lowerContent.includes('factor') ||
                   lowerContent.includes('aspect')) {
          console.log('Detected as criteria');
          return { criteria: items };
        }
        
        // Default fallback - assume competitors if we can't determine
        console.log('Could not determine type, defaulting to competitors');
        return { competitors: items };
      }
    }
  }

  async getCompetitors(target: string): Promise<LLMResponse[]> {
    const prompt = `List up to 20 competitors for "${target}". 
Return as a JSON array with key "competitors". 
Include both direct competitors and alternative products/services.
Example format: {"competitors": ["Competitor 1", "Competitor 2", ...]}`;

    const promises = LLM_MODELS.map(model => 
      this.callLLM(model, prompt)
    );

    return Promise.all(promises);
  }

  async getCriteria(target: string): Promise<LLMResponse[]> {
    const prompt = `List up to 20 comparison criteria/features for evaluating "${target}". 
Return as a JSON array with key "criteria".
Include price, key features, and differentiating factors.
Example format: {"criteria": ["Price", "Feature 1", "Feature 2", ...]}`;

    const promises = LLM_MODELS.map(model => 
      this.callLLM(model, prompt)
    );

    return Promise.all(promises);
  }

  // Test method to debug individual models
  async testSingleModel(model: string, target: string): Promise<LLMResponse> {
    const prompt = `List up to 5 competitors for "${target}". 
Return as a JSON array with key "competitors". 
Example format: {"competitors": ["Competitor 1", "Competitor 2"]}`;

    return this.callLLM(model, prompt);
  }
} 