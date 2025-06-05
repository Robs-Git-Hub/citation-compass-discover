import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PaperSelector from '../components/PaperSelector';
import CitationsTable from '../components/CitationsTable';
import ProgressBar from '../components/ProgressBar';
import ErrorMessage from '../components/ErrorMessage';
import { Paper, Citation } from '../types/semantic-scholar';
import { SemanticScholarService } from '../services/semanticScholar';
import { useCitationStore } from '../store/citationStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';
import { Network, Table } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const {
    selectedPaper,
    firstDegreeCitations,
    setSelectedPaper,
    setFirstDegreeCitations,
    setSecondDegreeCitations,
    updateProgress,
    progress,
    isExpanding,
    setIsExpanding,
    resetStore,
    clearNetworkData
  } = useCitationStore();

  // Effect to sync local citations with store
  useEffect(() => {
    if (selectedPaper && firstDegreeCitations.length > 0) {
      setCitations(firstDegreeCitations);
    }
  }, [selectedPaper, firstDegreeCitations]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    setShowResults(false);
    setCitations([]);
    resetStore();

    try {
      if (import.meta.env.DEV) {
        console.log(`Starting search for: "${query}"`);
      }
      
      const response = await SemanticScholarService.searchPapers(query);
      setSearchResults(response.data);
      setShowResults(true);
      
      if (import.meta.env.DEV) {
        console.log(`Search completed successfully, found ${response.data.length} papers`);
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Search error:', err);
      }
      
      const appError = ErrorHandler.handleApiError(err);
      setError(appError.userMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaperSelect = async (paper: Paper) => {
    setSelectedPaper(paper);
    setShowResults(false);
    setIsLoadingCitations(true);
    setError(null);
    clearNetworkData();

    try {
      const response = await SemanticScholarService.getCitations(paper.paperId);
      setCitations(response.data);
      setFirstDegreeCitations(response.data);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Citations fetch error:', err);
      }
      
      const appError = ErrorHandler.handleApiError(err);
      setError(appError.userMessage);
    } finally {
      setIsLoadingCitations(false);
    }
  };

  const handleExpandToSecondDegree = async () => {
    if (!firstDegreeCitations.length) return;

    setIsExpanding(true);
    setError(null);

    try {
      const secondDegreeMap = await SemanticScholarService.getSecondDegreeCitations(
        firstDegreeCitations,
        updateProgress
      );

      secondDegreeMap.forEach((citationList, paperId) => {
        setSecondDegreeCitations(paperId, citationList);
      });

      if (import.meta.env.DEV) {
        console.log('2nd degree expansion completed');
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Second degree expansion error:', err);
      }
      
      const appError = ErrorHandler.handleApiError(err);
      setError(appError.userMessage);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleViewNetwork = () => {
    if (selectedPaper) {
      navigate(`/paper/${selectedPaper.paperId}/network`);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (selectedPaper) {
      handlePaperSelect(selectedPaper);
    }
  };

  const canExpandToSecondDegree = firstDegreeCitations.length > 0 && 
    firstDegreeCitations.some(c => c.citationCount && c.citationCount > 0) && 
    !isExpanding && 
    !progress.isComplete;

  const canViewNetwork = firstDegreeCitations.length > 0;

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
              Find related papers
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

        {/* View Selection Tabs - Only show when there's a selected paper */}
        {selectedPaper && (
          <div className="w-full max-w-6xl mx-auto mt-8 mb-6">
            <div className="flex justify-center">
              <Tabs value="table" className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Table View
                  </TabsTrigger>
                  <TabsTrigger 
                    value="network" 
                    className="flex items-center gap-2"
                    onClick={handleViewNetwork}
                    disabled={!canViewNetwork}
                  >
                    <Network className="h-4 w-4" />
                    Network View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}

        {selectedPaper && (
          <div className="w-full max-w-6xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Selected Paper</h2>
              <div className="text-gray-700">
                <div className="font-medium mb-1">
                  {selectedPaper.url ? (
                    <a
                      href={selectedPaper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-brand-primary transition-colors"
                    >
                      {selectedPaper.title}
                    </a>
                  ) : (
                    selectedPaper.title
                  )}
                </div>
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

        {/* Action Button - Only show Expand to 2nd Degree button with brand color */}
        {canExpandToSecondDegree && (
          <div className="w-full max-w-6xl mx-auto mt-6">
            <div className="text-center">
              <Button
                onClick={handleExpandToSecondDegree}
                className="bg-brand-primary text-white hover:bg-brand-primary-hover px-6 py-3 text-lg"
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
            Powered by <a href="https://www.semanticscholar.org/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-primary-hover">Semantic Scholar API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
