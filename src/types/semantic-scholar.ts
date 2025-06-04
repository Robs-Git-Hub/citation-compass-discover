
export interface Author {
  authorId?: string;
  name: string;
}

export interface Paper {
  paperId: string;
  title: string;
  authors?: Author[];
  year?: number;
  venue?: string;
  citationCount?: number;
  url?: string;
}

export interface Citation {
  paperId: string;
  title?: string;
  authors?: Author[];
  year?: number;
  venue?: string;
  citationCount?: number;
  url?: string;
  secondDegreeCitations?: Citation[];
  isExpanded?: boolean;
}

export interface SearchResponse {
  data: Paper[];
  total: number;
}

export interface CitationsResponse {
  data: Citation[];
  total: number;
}

export interface ProgressState {
  current: number;
  total: number;
  currentPaper?: string;
  isComplete: boolean;
}

export interface CitationNetworkData {
  firstDegree: Citation[];
  secondDegree: Map<string, Citation[]>;
  progress: ProgressState;
}
