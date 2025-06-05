import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PaperSelector from '../components/PaperSelector';
import CitationsTable from '../components/CitationsTable';
import ProgressBar from '../components/ProgressBar';
import ErrorMessage from '../components/ErrorMessage';
import GeminiApiKeyModal from '../components/GeminiApiKeyModal';
import { Paper, Citation } from '../types/semantic-scholar';
import { SemanticScholarService } from '../services/semanticScholar';
import { useCitationStore } from '../store/citationStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';
import { Network, Table, FileText } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Gemini API key state (session-only, not persisted)
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isGeminiKeyModalOpen, setIsGeminiKeyModalOpen] = useState(false);

  const {
    selectedPaper,
    firstDegreeCitations,
    secondDegreeCitations,
    setSelectedPaper,
    setFirstDegreeCitations,
    setSecondDegreeCitations,
    updateProgress,
    progress,
    isExpanding,
    setIsExpanding,
    isFetchingAbstracts,
    setIsFetchingAbstracts,
    updateCitationAbstract,
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

  const handleFetchMissingAbstracts = () => {
    if (!geminiApiKey) {
      setIsGeminiKeyModalOpen(true);
    } else {
      startFetchingAbstracts();
    }
  };

  const startFetchingAbstracts = async () => {
    const eligibleCitations = getEligibleCitationsForAbstractFetch();
    if (eligibleCitations.length === 0) return;

    setIsFetchingAbstracts(true);
    setError(null);

    try {
      // TODO: Implement actual Gemini API calls in Phase 3
      console.log(`Starting to fetch abstracts for ${eligibleCitations.length} papers...`);
      
      // Simulate progress for now
      for (let i = 0; i < eligibleCitations.length; i++) {
        const citation = eligibleCitations[i];
        updateProgress({
          current: i + 1,
          total: eligibleCitations.length,
          currentPaper: citation.title || 'Unknown paper',
          isComplete: false
        });
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO: Replace with actual Gemini API call
        // For now, just mark as processed
        updateCitationAbstract(citation.paperId, null, true);
      }

      updateProgress({
        current: eligibleCitations.length,
        total: eligibleCitations.length,
        isComplete: true
      });

      if (import.meta.env.DEV) {
        console.log('Abstract fetching completed');
      }
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Abstract fetching error:', err);
      }
      setError('Failed to fetch abstracts. Please try again.');
    } finally {
      setIsFetchingAbstracts(false);
    }
  };

  const handleGeminiApiKeySubmit = (apiKey: string) => {
    setGeminiApiKey(apiKey);
    if (import.meta.env.DEV) {
      console.log('Gemini API key set for session');
    }
    // Start fetching abstracts after setting the key
    setTimeout(() => startFetchingAbstracts(), 100);
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

  // Check if there are eligible citations for abstract fetching
  const getEligibleCitationsForAbstractFetch = () => {
    const allCitations = [
      ...firstDegreeCitations,
      ...Array.from(secondDegreeCitations.values()).flat()
    ];

    return allCitations.filter(citation => 
      !citation.abstract && 
      citation.externalIds?.DOI &&
      !citation.abstractFetchedViaGemini &&
      // TODO: Add localStorage check for abstractUnavailable in Phase 4
      true
    );
  };

  const eligibleCitations = getEligibleCitationsForAbstractFetch();
  const canFetchAbstracts = eligibleCitations.length > 0 && 
    !isExpanding && 
    !isLoadingCitations && 
    !isFetchingAbstracts &&
    geminiApiKey.length > 0;
  
  const canExpandToSecondDegree = firstDegreeCitations.length > 0 && 
    firstDegreeCitations.some(c => c.citationCount && c.citationCount > 0) && 
    !isExpanding && 
    !isFetchingAbstracts &&
    !progress.isComplete;

  const canViewNetwork = firstDegreeCitations.length > 0;

  const showFetchAbstractsButton = eligibleCitations.length > 0 && 
    !isExpanding && 
    !isLoadingCitations && 
    !isFetchingAbstracts;

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

        {/* Action Buttons */}
        {(showFetchAbstractsButton || canExpandToSecondDegree) && (
          <div className="w-full max-w-6xl mx-auto mt-6">
            <div className="text-center space-y-3">
              {showFetchAbstractsButton && (
                <div>
                  <Button
                    onClick={handleFetchMissingAbstracts}
                    className="bg-brand-primary text-white hover:bg-brand-primary-hover px-6 py-3 text-lg mr-4"
                    disabled={!canFetchAbstracts}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    {isFetchingAbstracts ? 'Fetching Abstracts...' : 'Fetch Missing Abstracts'}
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Found {eligibleCitations.length} paper{eligibleCitations.length !== 1 ? 's' : ''} with missing abstracts that can be fetched
                    {!geminiApiKey && ' (API key required)'}
                  </p>
                </div>
              )}
              
              {canExpandToSecondDegree && (
                <div>
                  <Button
                    onClick={handleExpandToSecondDegree}
                    className="bg-brand-primary text-white hover:bg-brand-primary-hover px-6 py-3 text-lg"
                    disabled={!canExpandToSecondDegree}
                  >
                    {isExpanding ? 'Expanding...' : 'Expand to 2nd Degree Citations'}
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    This will find papers that cite the papers shown below
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar progress={progress} isVisible={isExpanding || isFetchingAbstracts || progress.isComplete} />

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

      {/* Gemini API Key Modal */}
      <GeminiApiKeyModal
        isOpen={isGeminiKeyModalOpen}
        onClose={() => setIsGeminiKeyModalOpen(false)}
        onApiKeySubmit={handleGeminiApiKeySubmit}
      />

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
