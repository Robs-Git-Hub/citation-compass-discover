import { create } from 'zustand';
import { Paper, Citation, ProgressState } from '../types/semantic-scholar';

interface PaperTopicAssignment {
  paper_id: string;
  topics: string[];
}

interface CitationStore {
  selectedPaper: Paper | null;
  firstDegreeCitations: Citation[];
  secondDegreeCitations: Map<string, Citation[]>;
  progress: ProgressState;
  isExpanding: boolean;
  isFetchingAbstracts: boolean;
  geminiApiKey: string | null;
  topics: string[];
  paperTopics: Map<string, string[]>;
  
  setSelectedPaper: (paper: Paper | null) => void;
  setFirstDegreeCitations: (citations: Citation[]) => void;
  setSecondDegreeCitations: (paperId: string, citations: Citation[]) => void;
  updateProgress: (progress: ProgressState) => void;
  setIsExpanding: (expanding: boolean) => void;
  setIsFetchingAbstracts: (fetching: boolean) => void;
  updateCitationAbstract: (paperId: string, abstract: string | null, fetchedViaGemini: boolean) => void;
  setGeminiApiKey: (apiKey: string) => void;
  setTopicAssignments: (assignments: PaperTopicAssignment[]) => void;
  resetStore: () => void;
  clearNetworkData: () => void;
}

export const useCitationStore = create<CitationStore>((set, get) => ({
  selectedPaper: null,
  firstDegreeCitations: [],
  secondDegreeCitations: new Map(),
  progress: { current: 0, total: 0, isComplete: false },
  isExpanding: false,
  isFetchingAbstracts: false,
  geminiApiKey: null,
  topics: [],
  paperTopics: new Map(),

  setSelectedPaper: (paper) => set({ selectedPaper: paper }),

  setFirstDegreeCitations: (citations) => 
    set({ firstDegreeCitations: citations }),

  setSecondDegreeCitations: (paperId, citations) =>
    set((state) => {
      const newMap = new Map(state.secondDegreeCitations);
      newMap.set(paperId, citations);
      return { secondDegreeCitations: newMap };
    }),

  updateProgress: (progress) => set({ progress }),

  setIsExpanding: (expanding) => set({ isExpanding: expanding }),

  setIsFetchingAbstracts: (fetching) => set({ isFetchingAbstracts: fetching }),

  updateCitationAbstract: (paperId, abstract, fetchedViaGemini) =>
    set((state) => {
      // Update first degree citations
      const updatedFirstDegree = state.firstDegreeCitations.map(citation =>
        citation.paperId === paperId
          ? { ...citation, abstract, abstractFetchedViaGemini: fetchedViaGemini }
          : citation
      );

      // Update second degree citations
      const updatedSecondDegree = new Map(state.secondDegreeCitations);
      for (const [key, citations] of updatedSecondDegree) {
        const updatedCitations = citations.map(citation =>
          citation.paperId === paperId
            ? { ...citation, abstract, abstractFetchedViaGemini: fetchedViaGemini }
            : citation
        );
        updatedSecondDegree.set(key, updatedCitations);
      }

      return {
        firstDegreeCitations: updatedFirstDegree,
        secondDegreeCitations: updatedSecondDegree,
      };
    }),

  setGeminiApiKey: (apiKey) => set({ geminiApiKey: apiKey }),

  setTopicAssignments: (assignments) =>
    set((state) => {
      const allTopics = new Set<string>();
      const paperTopicMap = new Map<string, string[]>();

      assignments.forEach(assignment => {
        const topics = assignment.topics.length > 0 ? assignment.topics : ['Unlabelled'];
        topics.forEach(topic => allTopics.add(topic));
        paperTopicMap.set(assignment.paper_id, topics);
      });

      return {
        topics: Array.from(allTopics),
        paperTopics: paperTopicMap
      };
    }),

  resetStore: () => set({
    selectedPaper: null,
    firstDegreeCitations: [],
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
    isFetchingAbstracts: false,
    geminiApiKey: null,
    topics: [],
    paperTopics: new Map(),
  }),

  clearNetworkData: () => set({
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
    isFetchingAbstracts: false,
  }),
}));
