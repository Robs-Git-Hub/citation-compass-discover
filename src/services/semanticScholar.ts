
import { SearchResponse, CitationsResponse, ProgressState, Paper } from '../types/semantic-scholar';

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';

// Fields to request from the API - DOI field is not supported by the search endpoint
const PAPER_FIELDS = 'paperId,title,authors,year,venue,citationCount,url,abstract';

class RateLimiter {
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second between requests
  private maxRetries = 3;
  private failureCount = 0;
  private backoffMultiplier = 2;
  private maxBackoffTime = 30000; // 30 seconds max backoff

  async executeWithBackoff<T>(apiCall: () => Promise<T>): Promise<T> {
    let retries = 0;
    let delay = this.minInterval;

    // Circuit breaker - if too many failures, increase delay
    if (this.failureCount > 5) {
      delay = Math.min(this.minInterval * Math.pow(this.backoffMultiplier, this.failureCount - 5), this.maxBackoffTime);
    }

    while (retries < this.maxRetries) {
      try {
        // Ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < delay) {
          await this.sleep(delay - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
        const result = await apiCall();
        
        // Reset failure count on success
        this.failureCount = 0;
        return result;
      } catch (error: any) {
        this.failureCount++;
        
        if (error.status === 429 && retries < this.maxRetries - 1) {
          const retryAfter = error.headers?.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          
          if (import.meta.env.DEV) {
            console.log(`Rate limited, retrying in ${waitTime}ms...`);
          }
          
          await this.sleep(waitTime);
          delay *= this.backoffMultiplier;
          retries++;
        } else {
          throw error;
        }
      }
    }
    
    // If we get here, we've exhausted retries
    const error = new Error('Max retries exceeded due to rate limiting');
    (error as any).status = 429;
    throw error;
  }

  // New method for search with extended retry logic
  async executeSearchWithRetries<T>(apiCall: () => Promise<T>): Promise<T> {
    const maxRetryTime = 30000; // 30 seconds
    const startTime = Date.now();
    let retries = 0;
    let delay = 1000; // Start with 1 second delay

    while (Date.now() - startTime < maxRetryTime) {
      try {
        // Ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < delay) {
          await this.sleep(delay - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
        const result = await apiCall();
        
        // Reset failure count on success
        this.failureCount = 0;
        return result;
      } catch (error: any) {
        retries++;
        this.failureCount++;
        
        if (import.meta.env.DEV) {
          console.log(`Search attempt ${retries} failed, retrying in ${delay}ms...`);
        }
        
        // Check if we have time for another retry
        if (Date.now() - startTime + delay >= maxRetryTime) {
          throw error;
        }
        
        await this.sleep(delay);
        delay = Math.min(delay * 1.5, 5000); // Increase delay up to 5 seconds
      }
    }
    
    // If we get here, we've exceeded the retry time
    const error = new Error('Search failed after 30 seconds of retries');
    (error as any).status = 408; // Request timeout
    throw error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class SemanticScholarService {
  private static rateLimiter = new RateLimiter();

  static async searchPapers(query: string, limit: number = 10): Promise<SearchResponse> {
    const url = `${BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${PAPER_FIELDS}`;
    
    if (import.meta.env.DEV) {
      console.log(`Searching papers with query: "${query}"`);
    }
    
    return this.rateLimiter.executeSearchWithRetries(async () => {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = new Error(`Search failed: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).headers = response.headers;
        throw error;
      }
      
      return await response.json();
    });
  }

  static async getPaper(paperId: string): Promise<{ data: Paper }> {
    const url = `${BASE_URL}/paper/${paperId}?fields=${PAPER_FIELDS}`;
    
    return this.rateLimiter.executeWithBackoff(async () => {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = new Error(`Paper fetch failed: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).headers = response.headers;
        throw error;
      }
      
      const data = await response.json();
      return { data };
    });
  }

  static async getCitations(paperId: string, limit: number = 100): Promise<CitationsResponse> {
    // Get all citations by handling pagination
    const allCitations: any[] = [];
    let offset = 0;
    const pageSize = Math.min(limit, 100); // API limit is 100 per request
    
    while (true) {
      const url = `${BASE_URL}/paper/${paperId}/citations?limit=${pageSize}&offset=${offset}&fields=${PAPER_FIELDS}`;
      
      const response = await this.rateLimiter.executeWithBackoff(async () => {
        const response = await fetch(url);
        
        if (!response.ok) {
          const error = new Error(`Citations fetch failed: ${response.statusText}`);
          (error as any).status = response.status;
          (error as any).headers = response.headers;
          throw error;
        }
        
        return await response.json();
      });

      // Transform the response to match our Citation interface
      const transformedData = response.data.map((item: any) => ({
        ...item.citingPaper,
        paperId: item.citingPaper.paperId
      }));

      allCitations.push(...transformedData);

      // Check if we've reached the requested limit or if there are no more results
      if (allCitations.length >= limit || transformedData.length < pageSize || !response.next) {
        break;
      }

      offset += pageSize;
    }

    // Trim to requested limit
    const finalCitations = allCitations.slice(0, limit);

    return {
      data: finalCitations,
      total: allCitations.length
    };
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
        if (import.meta.env.DEV) {
          console.log(`Fetching citations for paper ${i + 1}/${total}: ${citation.title}`);
        }
        
        onProgress({ 
          current: i, 
          total, 
          currentPaper: citation.title,
          isComplete: false 
        });

        // Fetch up to 100 citations per paper (with pagination)
        const response = await this.getCitations(citation.paperId, 100);
        secondDegreeMap.set(citation.paperId, response.data);
      } catch (error) {
        // Continue with other papers even if one fails
        secondDegreeMap.set(citation.paperId, []);
        
        // Only log the error, don't break the entire process
        if (import.meta.env.DEV) {
          console.error(`Failed to fetch citations for ${citation.paperId}:`, error);
        }
      }
    }

    onProgress({ current: total, total, isComplete: true });
    return secondDegreeMap;
  }
}
