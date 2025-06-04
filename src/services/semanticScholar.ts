
import { SearchResponse, CitationsResponse, ProgressState } from '../types/semantic-scholar';

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';

// Fields to request from the API
const PAPER_FIELDS = 'paperId,title,authors,year,venue,citationCount,url';

class RateLimiter {
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second between requests
  private maxRetries = 3;

  async executeWithBackoff<T>(apiCall: () => Promise<T>): Promise<T> {
    let retries = 0;
    let delay = this.minInterval;

    while (retries < this.maxRetries) {
      try {
        // Ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minInterval) {
          await this.sleep(this.minInterval - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
        return await apiCall();
      } catch (error: any) {
        if (error.status === 429 && retries < this.maxRetries - 1) {
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await this.sleep(delay);
          delay *= 2; // Exponential backoff
          retries++;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class SemanticScholarService {
  private static rateLimiter = new RateLimiter();

  static async searchPapers(query: string, limit: number = 10): Promise<SearchResponse> {
    const url = `${BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${PAPER_FIELDS}`;
    
    return this.rateLimiter.executeWithBackoff(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      return await response.json();
    });
  }

  static async getCitations(paperId: string, limit: number = 100): Promise<CitationsResponse> {
    const url = `${BASE_URL}/paper/${paperId}/citations?limit=${limit}&fields=${PAPER_FIELDS}`;
    
    return this.rateLimiter.executeWithBackoff(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Citations fetch failed: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Transform the response to match our Citation interface
      const transformedData = {
        ...data,
        data: data.data.map((item: any) => ({
          ...item.citingPaper,
          paperId: item.citingPaper.paperId
        }))
      };
      
      return transformedData;
    });
  }

  static async getSecondDegreeCitations(
    firstDegreeCitations: any[],
    onProgress: (progress: ProgressState) => void
  ): Promise<Map<string, any[]>> {
    const papersWithCitations = firstDegreeCitations.filter(citation => 
      citation.citationCount && citation.citationCount > 0
    );

    const secondDegreeMap = new Map<string, any[]>();
    const total = papersWithCitations.length;

    onProgress({ current: 0, total, isComplete: false });

    for (let i = 0; i < papersWithCitations.length; i++) {
      const citation = papersWithCitations[i];
      try {
        console.log(`Fetching citations for paper ${i + 1}/${total}: ${citation.title}`);
        onProgress({ 
          current: i, 
          total, 
          currentPaper: citation.title,
          isComplete: false 
        });

        const response = await this.getCitations(citation.paperId, 50);
        secondDegreeMap.set(citation.paperId, response.data);
      } catch (error) {
        console.error(`Failed to fetch citations for ${citation.paperId}:`, error);
        // Continue with other papers even if one fails
        secondDegreeMap.set(citation.paperId, []);
      }
    }

    onProgress({ current: total, total, isComplete: true });
    return secondDegreeMap;
  }
}
