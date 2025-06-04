
import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import PaperSelector from '../components/PaperSelector';
import CitationsTable from '../components/CitationsTable';
import ProgressBar from '../components/ProgressBar';
import ErrorMessage from '../components/ErrorMessage';
import { Paper, Citation } from '../types/semantic-scholar';
import { SemanticScholarService } from '../services/semanticScholar';
import { useCitationStore } from '../store/citationStore';
import { Button } from '../components/ui/button';

const Index = () => {
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const {
    setFirstDegreeCitations,
    setSecondDegreeCitations,
    updateProgress,
    progress,
    isExpanding,
    setIsExpanding,
    resetStore
  } = useCitationStore();

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    setShowResults(false);
    setSelectedPaper(null);
    setCitations([]);
    resetStore();

    try {
      const response = await SemanticScholarService.searchPapers(query);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (err) {
      setError('Failed to search papers. Please check your connection and try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaperSelect = async (paper: Paper) => {
    setSelectedPaper(paper);
    setShowResults(false);
    setIsLoadingCitations(true);
    setError(null);
    resetStore();

    try {
      const response = await SemanticScholarService.getCitations(paper.paperId);
      setCitations(response.data);
      setFirstDegreeCitations(response.data);
    } catch (err) {
      setError('Failed to load citations. Please try again.');
      console.error('Citations error:', err);
    } finally {
      setIsLoadingCitations(false);
    }
  };

  const handleExpandToSecondDegree = async () => {
    if (!citations.length) return;

    setIsExpanding(true);
    setError(null);

    try {
      const secondDegreeMap = await SemanticScholarService.getSecondDegreeCitations(
        citations,
        updateProgress
      );

      // Store the results in the citation store
      secondDegreeMap.forEach((citationList, paperId) => {
        setSecondDegreeCitations(paperId, citationList);
      });

      console.log('2nd degree expansion completed');
    } catch (err) {
      setError('Failed to expand to 2nd degree citations. Please try again.');
      console.error('2nd degree expansion error:', err);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (selectedPaper) {
      handlePaperSelect(selectedPaper);
    }
  };

  const canExpandToSecondDegree = citations.length > 0 && 
    citations.some(c => c.citationCount && c.citationCount > 0) && 
    !isExpanding && 
    !progress.isComplete;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Academic Citation Explorer
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find related papers through the citation network
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        
        <PaperSelector 
          papers={searchResults}
          onSelect={handlePaperSelect}
          isVisible={showResults}
        />

        {selectedPaper && (
          <div className="w-full max-w-6xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Selected Paper</h2>
              <div className="text-gray-700">
                <div className="font-medium mb-1">{selectedPaper.title}</div>
                <div className="text-sm text-gray-600">
                  {selectedPaper.authors?.map(author => author.name).join(', ')} • {selectedPaper.year}
                </div>
                {selectedPaper.venue && (
                  <div className="text-sm text-gray-500 mt-1">{selectedPaper.venue}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expand to 2nd Degree Button */}
        {canExpandToSecondDegree && (
          <div className="w-full max-w-6xl mx-auto mt-6">
            <div className="text-center">
              <Button
                onClick={handleExpandToSecondDegree}
                className="bg-[#437e84] hover:bg-[#2d5a5f] text-white px-6 py-3 text-lg"
                disabled={isExpanding}
              >
                {isExpanding ? 'Expanding...' : 'Expand to 2nd Degree Citations'}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will find papers that cite the papers shown below
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar progress={progress} isVisible={isExpanding || progress.isComplete} />

        {error && (
          <ErrorMessage message={error} onRetry={selectedPaper ? handleRetry : undefined} />
        )}

        <CitationsTable 
          citations={citations}
          isLoading={isLoadingCitations}
        />

        {selectedPaper && citations.length === 0 && !isLoadingCitations && !error && (
          <div className="w-full max-w-6xl mx-auto mt-8 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <p className="text-gray-600">No citations found for this paper.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            Powered by <a href="https://www.semanticscholar.org/" target="_blank" rel="noopener noreferrer" className="text-[#437e84] hover:text-[#2d5a5f]">Semantic Scholar API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
