
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export class GeminiService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  
  static async fetchAbstractFromGemini(
    apiKey: string, 
    doiUrl: string, 
    title: string
  ): Promise<string> {
    const prompt = `Please find and return the abstract for the academic paper with DOI: ${doiUrl} and title: "${title}". 

If you can find the abstract, return only the abstract text without any additional commentary.

If you cannot find the abstract or the paper, respond with exactly: "Abstract not found"`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 1000,
      }
    };

    const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content.parts[0]) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text.trim();
  }

  static async fetchAbstractWithRetry(
    apiKey: string,
    doiUrl: string,
    title: string,
    maxRetries: number = 2
  ): Promise<string> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait 2-5 seconds between retries
          const delay = 2000 + Math.random() * 3000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        return await this.fetchAbstractFromGemini(apiKey, doiUrl, title);
      } catch (error) {
        lastError = error as Error;
        if (import.meta.env.DEV) {
          console.error(`Gemini API attempt ${attempt + 1} failed:`, error);
        }
      }
    }

    throw lastError!;
  }
}
