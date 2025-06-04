
import { SearchResponse, CitationsResponse } from '../types/semantic-scholar';

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';

// Fields to request from the API
const PAPER_FIELDS = 'paperId,title,authors,year,venue,citationCount,url';

export class SemanticScholarService {
  static async searchPapers(query: string, limit: number = 10): Promise<SearchResponse> {
    const url = `${BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${PAPER_FIELDS}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching papers:', error);
      throw error;
    }
  }

  static async getCitations(paperId: string, limit: number = 100): Promise<CitationsResponse> {
    const url = `${BASE_URL}/paper/${paperId}/citations?limit=${limit}&fields=${PAPER_FIELDS}`;
    
    try {
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
    } catch (error) {
      console.error('Error fetching citations:', error);
      throw error;
    }
  }
}
