import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PaperSelector from '../components/PaperSelector';
import CitationsTable from '../components/CitationsTable';
import ProgressBar from '../components/ProgressBar';
import ErrorMessage from '../components/ErrorMessage';
import GeminiApiKeyModal from '../components/GeminiApiKeyModal';
import AbstractFetchingReport, { AbstractFetchResult } from '../components/AbstractFetchingReport';
import { Paper, Citation } from '../types/semantic-scholar';
import { SemanticScholarService } from '../services/semanticScholar';
import { GeminiService } from '../services/geminiService';
import { RateLimiter } from '../utils/rateLimiter';
import { useCitationStore } from '../store/citationStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';
import { Network, Table, FileText } from 'lucide-react';
import { AbstractStorage } from '../utils/abstractStorage';

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

  // Abstract fetching report state
  const [fetchingResults, setFetchingResults] = useState<AbstractFetchResult[]>([]);
  const [showFetchingReport, setShowFetchingReport] = useState(false);

  // Add rate limiter instance
  const [rateLimiter] = useState(() => new RateLimiter(4000)); // 4 seconds between calls

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

  // Effect to clean up expired localStorage entries on component mount
  useEffect(() => {
    AbstractStorage.clearExpiredEntries();
  }, []);

  // Helper function to load abstracts from localStorage for citations
  const loadAbstractsFromStorage = (citations: Citation[]): Citation[] => {
    return citations.map(citation => {
      if (AbstractStorage.isMarkedAsUnavailable(citation.paperId)) {
        return {
          ...citation,
          abstract: null,
          abstractFetchedViaGemini: true
        };
      }
      return citation;
    });
  };

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
      
      // Load abstracts from localStorage before setting citations
      const citationsWithStoredAbstracts = loadAbstractsFromStorage(response.data);
      
      setCitations(citationsWithStoredAbstracts);
      setFirstDegreeCitations(citationsWithStoredAbstracts);
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

      // Load abstracts from localStorage for second degree citations
      secondDegreeMap.forEach((citationList, paperId) => {
        const citationsWithStoredAbstracts = loadAbstractsFromStorage(citationList);
        setSecondDegreeCitations(paperId, citationsWithStoredAbstracts);
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
      startFetchingAbstracts(geminiApiKey);
    }
  };

  const startFetchingAbstracts = async (apiKey: string) => {
    const eligibleCitations = getEligibleCitationsForAbstractFetch();
    if (eligibleCitations.length === 0) return;

    setIsFetchingAbstracts(true);
    setError(null);
    setFetchingResults([]); // Reset results

    const results: AbstractFetchResult[] = [];

    try {
      if (import.meta.env.DEV) {
        console.log(`Starting to fetch abstracts for ${eligibleCitations.length} papers...`);
      }

      for (let i = 0; i < eligibleCitations.length; i++) {
        const citation = eligibleCitations[i];
        
        updateProgress({
          current: i,
          total: eligibleCitations.length,
          currentPaper: citation.title || 'Unknown paper',
          isComplete: false
        });

        try {
          // Use rate limiter to ensure 4-second delays between API calls
          const abstractText = await rateLimiter.add(() => 
            GeminiService.fetchAbstractWithRetry(
              apiKey,
              `https://doi.org/${citation.externalIds?.DOI}`,
              citation.title || ''
            )
          );

          // Check if Gemini responded with "Abstract not found"
          const isAbstractNotFound = /abstract\s+not\s+found/i.test(abstractText.trim());
          
          if (isAbstractNotFound) {
            // Mark as unavailable in localStorage and store
            AbstractStorage.markAsUnavailable(citation.paperId);
            updateCitationAbstract(citation.paperId, null, true);
            
            results.push({
              paperId: citation.paperId,
              title: citation.title || 'Untitled',
              status: 'not_found'
            });
            
            if (import.meta.env.DEV) {
              console.log(`Abstract not found for: ${citation.title}`);
            }
          } else {
            // Store the found abstract
            updateCitationAbstract(citation.paperId, abstractText, true);
            
            results.push({
              paperId: citation.paperId,
              title: citation.title || 'Untitled',
              status: 'success'
            });
            
            if (import.meta.env.DEV) {
              console.log(`Abstract fetched for: ${citation.title}`);
            }
          }

        } catch (error) {
          // After retries failed, mark as unavailable in localStorage and store
          AbstractStorage.markAsUnavailable(citation.paperId);
          updateCitationAbstract(citation.paperId, null, true);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            paperId: citation.paperId,
            title: citation.title || 'Untitled',
            status: 'failed',
            error: errorMessage
          });
          
          if (import.meta.env.DEV) {
            console.error(`Failed to fetch abstract for ${citation.title}:`, error);
          }
        }
      }

      updateProgress({
        current: eligibleCitations.length,
        total: eligibleCitations.length,
        isComplete: true
      });

      setFetchingResults(results);
      setShowFetchingReport(true);

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
    setTimeout(() => startFetchingAbstracts(apiKey), 100);
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

  // Check if there are eligible citations for abstract fetching (including 2nd degree)
  const getEligibleCitationsForAbstractFetch = () => {
    const allCitations = [
      ...firstDegreeCitations,
      ...Array.from(secondDegreeCitations.values()).flat()
    ];

    return allCitations.filter(citation => 
      !citation.abstract && 
      citation.externalIds?.DOI &&
      !citation.abstractFetchedViaGemini &&
      !AbstractStorage.isMarkedAsUnavailable(citation.paperId)
    );
  };

  const eligibleCitations = getEligibleCitationsForAbstractFetch();
  
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
                    disabled={false}
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
        <ProgressBar 
          progress={progress} 
          isVisible={isExpanding || isFetchingAbstracts || progress.isComplete}
          isExpanding={isExpanding}
          isFetchingAbstracts={isFetchingAbstracts}
        />

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

      {/* Abstract Fetching Report Modal */}
      <AbstractFetchingReport
        isOpen={showFetchingReport}
        onClose={() => setShowFetchingReport(false)}
        results={fetchingResults}
        totalProcessed={fetchingResults.length}
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
