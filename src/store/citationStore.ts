
import { create } from 'zustand';
import { Citation, ProgressState } from '../types/semantic-scholar';

interface CitationStore {
  firstDegreeCitations: Citation[];
  secondDegreeCitations: Map<string, Citation[]>;
  progress: ProgressState;
  isExpanding: boolean;
  
  setFirstDegreeCitations: (citations: Citation[]) => void;
  setSecondDegreeCitations: (paperId: string, citations: Citation[]) => void;
  updateProgress: (progress: ProgressState) => void;
  setIsExpanding: (expanding: boolean) => void;
  resetStore: () => void;
}

export const useCitationStore = create<CitationStore>((set, get) => ({
  firstDegreeCitations: [],
  secondDegreeCitations: new Map(),
  progress: { current: 0, total: 0, isComplete: false },
  isExpanding: false,

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
    firstDegreeCitations: [],
    secondDegreeCitations: new Map(),
    progress: { current: 0, total: 0, isComplete: false },
    isExpanding: false,
  }),
}));
