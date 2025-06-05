
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

// Define the shape of the papers we'll receive
interface PaperInput {
  title: string;
  abstract?: string; // Abstract is optional
}

// Define the shape of the JSON response we expect from Gemini
interface GeminiTopicsResponse {
  topic_label: string[];
}

// Define the shape of papers with IDs
interface PaperWithId {
  id: string; // Using string for ID is safer (e.g., semantic scholar IDs)
  title: string;
}

// Define the shape of the final mapping object we expect back
interface PaperTopicAssignment {
  paper_id: string;
  topics: string[];
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

  static async generateTopicsFromPapers(
    papers: PaperInput[],
    apiKey: string
  ): Promise<string[]> {
    const MODEL_ID = "gemini-2.5-flash-preview-05-20";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

    // 1. Construct the prompt body from the paper data
    const papersText = papers
      .map(p => `Title: ${p.title}\nAbstract: ${p.abstract || 'N/A'}`)
      .join('\n\n---\n\n');

    // 2. Define the full request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
                You are an expert research assistant. Your task is to analyze the following list of academic paper titles and abstracts.
                Identify a maximum of 15 key, high-level research topics from the text provided.
                The topics should be concise, ideally 2-4 words long (e.g., "Reinforcement Learning", "Protein Folding", "Roman History").
                Do not explain your reasoning. Respond ONLY with the JSON object as specified in the schema.

                Here is the list of papers:
                ---
                ${papersText}
              `
            },
          ]
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            "topic_label": {
              "type": "array",
              "items": { "type": "string" }
            }
          },
          required: ["topic_label"]
        },
      },
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const responseJson: GeminiTopicsResponse = JSON.parse(data.candidates[0].content.parts[0].text);

      return responseJson.topic_label;

    } catch (error) {
      console.error("Failed to generate topics:", error);
      throw error;
    }
  }

  static async assignTopicsToPapers(
    papers: PaperWithId[],
    topics: string[],
    apiKey: string
  ): Promise<PaperTopicAssignment[]> {
    const MODEL_ID = "gemini-2.5-flash-preview-05-20";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

    // 1. Format the input data clearly for the prompt
    const papersJsonString = JSON.stringify(papers);
    const topicsJsonString = JSON.stringify(topics);

    // 2. Define the full request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
                You are a precise data categorizer. Your task is to assign topics to academic papers.
                You will be given a list of papers and a predefined list of topics.
                For each paper, you must assign one or more topics from the provided list.
                If a paper does not fit any of the topics well, assign it an empty array for its topics: [].
                Do not use any topics that are not in the provided list.
                Respond ONLY with the JSON object as specified in the schema.

                Here is the list of topics you MUST use:
                ${topicsJsonString}

                Here is the list of papers to categorize:
                ${papersJsonString}
              `
            },
          ]
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            "assignments": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "paper_id": { "type": "string" },
                  "topics": {
                    "type": "array",
                    "items": { "type": "string" }
                  }
                },
                "required": ["paper_id", "topics"]
              }
            }
          },
          "required": ["assignments"]
        },
      },
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const responseJson = JSON.parse(data.candidates[0].content.parts[0].text);
      
      return responseJson.assignments;

    } catch (error) {
      console.error("Failed to assign topics:", error);
      throw error;
    }
  }
}
