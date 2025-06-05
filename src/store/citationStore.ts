
import { create } from 'zustand';
import { Paper, Citation, ProgressState } from '../types/semantic-scholar';

interface CitationStore {
  selectedPaper: Paper | null;
  firstDegreeCitations: Citation[];
  secondDegreeCitations: Map<string, Citation[]>;
  progress: ProgressState;
  isExpanding: boolean;
  
  setSelectedPaper: (paper: Paper | null) => void;
  setFirstDegreeCitations: (citations: Citation[]) => void;
  setSecondDegreeCitations: (paperId: string, citations: Citation[]) => void;
  updateProgress: (progress: ProgressState) => void;
  setIsExpanding: (expanding: boolean) => void;
  resetStore: () => void;
  clearNetworkData: () => void;
}

export const useCitationStore = create<CitationStore>((set, get) => ({
  selectedPaper: null,
  firstDegreeCitations: [],
  secondDegreeCitations: new Map(),
  progress: { current: 0, total: 0, isComplete: false },
  isExpanding: false,

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

  resetStore: () => set({
    selectedPaper: null,
    firstDegreeCitations: [],
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
  }),

  clearNetworkData: () => set({
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
  }),
}));
