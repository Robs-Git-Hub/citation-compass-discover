
import { create } from 'zustand';
import { Paper, Citation, ProgressState } from '../types/semantic-scholar';

interface CitationStore {
  selectedPaper: Paper | null;
  firstDegreeCitations: Citation[];
  secondDegreeCitations: Map<string, Citation[]>;
  progress: ProgressState;
  isExpanding: boolean;
  isFetchingAbstracts: boolean;
  geminiApiKey: string | null;
  
  setSelectedPaper: (paper: Paper | null) => void;
  setFirstDegreeCitations: (citations: Citation[]) => void;
  setSecondDegreeCitations: (paperId: string, citations: Citation[]) => void;
  updateProgress: (progress: ProgressState) => void;
  setIsExpanding: (expanding: boolean) => void;
  setIsFetchingAbstracts: (fetching: boolean) => void;
  updateCitationAbstract: (paperId: string, abstract: string | null, fetchedViaGemini: boolean) => void;
  setGeminiApiKey: (apiKey: string) => void;
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

  resetStore: () => set({
    selectedPaper: null,
    firstDegreeCitations: [],
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
    isFetchingAbstracts: false,
    geminiApiKey: null,
  }),

  clearNetworkData: () => set({
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
    isFetchingAbstracts: false,
  }),
}));
