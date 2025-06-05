
export interface Author {
  authorId?: string;
  name: string;
}

export interface ExternalIds {
  DOI?: string;
  ArXiv?: string;
  MAG?: string;
  ACL?: string;
  PubMed?: string;
  Corpusid?: string;
}

export interface Paper {
  paperId: string;
  title: string;
  authors?: Author[];
  year?: number;
  venue?: string;
  citationCount?: number;
  url?: string;
  abstract?: string;
  externalIds?: ExternalIds;
}

export interface Citation {
  paperId: string;
  title?: string;
  authors?: Author[];
  year?: number;
  venue?: string;
  citationCount?: number;
  url?: string;
  abstract?: string;
  externalIds?: ExternalIds;
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
