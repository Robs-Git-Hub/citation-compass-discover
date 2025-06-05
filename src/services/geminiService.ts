
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
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  static async fetchAbstractFromGemini(
    apiKey: string, 
    doiUrl: string, 
    title: string
  ): Promise<string> {
    const escapedTitle = title.replace(/"/g, '\\"'); // Important: handles titles with quotes

    const prompt = `Conduct a google search for \\\"url:${doiUrl}\\\" and visit the first result. If it is a page of the paper '${escapedTitle}'. Read the whole page and identify the abstract section if there is one. Output only the full verbatim abstract text with no introduction or ending message. If the page is not about '${escapedTitle}' try the other results to find the paper's homepage. If you do not find it or you find it and there is no abstract on the webpage then output \\\"Abstract not found\\\".`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.25,
        topP: 0.2,
        responseMimeType: "text/plain",
        maxOutputTokens: 1000,
      },
      tools: [
        {
          "googleSearch": {}
        }
      ]
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
