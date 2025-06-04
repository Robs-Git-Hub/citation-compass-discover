
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
}

export interface SearchResponse {
  data: Paper[];
  total: number;
}

export interface CitationsResponse {
  data: Citation[];
  total: number;
}
