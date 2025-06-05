
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

  static async generateTopicsFromPapers(apiKey: string, papers: any[]): Promise<string[]> {
    // Create a prompt with paper titles and abstracts
    const paperSummaries = papers
      .slice(0, 20) // Limit to first 20 papers to avoid token limits
      .map((paper, index) => {
        const title = paper.title || 'Untitled';
        const abstract = paper.abstract || 'No abstract available';
        return `${index + 1}. ${title}\nAbstract: ${abstract.substring(0, 200)}${abstract.length > 200 ? '...' : ''}`;
      })
      .join('\n\n');

    const prompt = `Analyze the following research papers and suggest 15 specific, academic topic categories that would be useful for organizing and filtering these papers. Focus on research areas, methodologies, and domains represented in the papers.

Papers:
${paperSummaries}

Please provide exactly 15 topic suggestions, one per line, without numbering or bullet points. Make the topics specific enough to be meaningful but broad enough that multiple papers could fall under each topic. Examples of good topics: "Machine Learning", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Deep Neural Networks", etc.`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        responseMimeType: "text/plain",
        maxOutputTokens: 500,
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

    const responseText = data.candidates[0].content.parts[0].text.trim();
    
    // Parse the response into individual topics
    const topics = responseText
      .split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0)
      .slice(0, 15); // Ensure we don't exceed 15 topics

    return topics;
  }
}
