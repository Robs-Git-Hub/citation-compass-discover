import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper } from '../types/semantic-scholar';
import { SemanticScholarService } from '../services/semanticScholar';
import { useCitationStore } from '../store/citationStore';
import { ErrorHandler } from '../utils/errorHandler';
import PapersNetwork from '../components/PapersNetwork';
import ErrorMessage from '../components/ErrorMessage';
import TopicPlottingModal from '../components/TopicPlottingModal';
import GeminiApiKeyModal from '../components/GeminiApiKeyModal';
import TopicFilterBar from '../components/TopicFilterBar';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Table, Network, Tag } from 'lucide-react';

const NetworkView: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  const {
    selectedPaper,
    firstDegreeCitations,
    geminiApiKey,
    topics,
    paperTopics,
    setSelectedPaper,
    setFirstDegreeCitations,
    setGeminiApiKey
  } = useCitationStore();

  useEffect(() => {
    if (!paperId) {
      navigate('/');
      return;
    }

    loadNetworkData();
  }, [paperId]);

  const loadNetworkData = async () => {
    if (!paperId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if we already have the data in store and it matches the current paperId
      if (selectedPaper && selectedPaper.paperId === paperId && firstDegreeCitations.length > 0) {
        // Data is already available in store, use it directly
        setIsLoading(false);
        return;
      }

      // If we don't have the data, fetch only the basic paper and first-degree citations
      // First, get paper details
      const paperResponse = await SemanticScholarService.getPaper(paperId);
      const paper = paperResponse.data;
      setSelectedPaper(paper);

      // Get first degree citations
      const citationsResponse = await SemanticScholarService.getCitations(paperId);
      const citations = citationsResponse.data;
      setFirstDegreeCitations(citations);

    } catch (err: any) {
      const appError = ErrorHandler.handleApiError(err);
      setError(appError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToTable = () => {
    navigate('/');
  };

  const handleRetry = () => {
    loadNetworkData();
  };

  const handlePlotTopics = () => {
    if (!geminiApiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    setIsTopicModalOpen(true);
  };

  const handleApiKeySubmit = (apiKey: string) => {
    setGeminiApiKey(apiKey);
    setIsApiKeyModalOpen(false);
    setIsTopicModalOpen(true);
  };

  const handleTopicToggle = (topic: string) => {
    const newSelection = new Set(selectedTopics);
    if (newSelection.has(topic)) {
      newSelection.delete(topic);
    } else {
      newSelection.add(topic);
    }
    setSelectedTopics(newSelection);
  };

  const handleClearAllTopics = () => {
    setSelectedTopics(new Set());
  };

  // Convert citations to Paper format to match the expected type
  const convertedCitations: Paper[] = firstDegreeCitations.map(citation => ({
    paperId: citation.paperId,
    title: citation.title || 'Untitled', // Ensure title is never undefined
    authors: citation.authors,
    year: citation.year,
    venue: citation.venue,
    citationCount: citation.citationCount,
    url: citation.url,
    abstract: citation.abstract || undefined,
    externalIds: citation.externalIds
  }));

  // Combine selected paper and converted citations into a single papers array
  const allPapers: Paper[] = selectedPaper ? [selectedPaper, ...convertedCitations] : convertedCitations;

  // Filter papers based on selected topics
  const filteredPapers = selectedTopics.size === 0 ? allPapers : allPapers.filter(paper => {
    const assignedTopics = paperTopics.get(paper.paperId) || [];
    return assignedTopics.some(topic => selectedTopics.has(topic));
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-96 mb-6" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={error} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

  if (!selectedPaper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Paper not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Selection Tabs */}
        <div className="flex justify-center mb-8">
          <Tabs value="network" className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="table" 
                className="flex items-center gap-2"
                onClick={handleBackToTable}
              >
                <Table className="h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <PapersNetwork
          selectedPaper={selectedPaper}
          firstDegreeCitations={firstDegreeCitations.filter(citation => 
            selectedTopics.size === 0 || 
            (paperTopics.get(citation.paperId) || []).some(topic => selectedTopics.has(topic))
          )}
          onBackToTable={handleBackToTable}
          onPlotTopics={handlePlotTopics}
          topics={topics}
          selectedTopics={selectedTopics}
          onTopicToggle={handleTopicToggle}
          onClearAllTopics={handleClearAllTopics}
        />
      </div>

      {/* API Key Modal */}
      <GeminiApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onApiKeySubmit={handleApiKeySubmit}
      />

      {/* Topic Plotting Modal */}
      <TopicPlottingModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        papers={allPapers}
        geminiApiKey={geminiApiKey}
      />
    </div>
  );
};

export default NetworkView;
