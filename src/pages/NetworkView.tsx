import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper } from '../types/semantic-scholar';
import { SemanticScholarService } from '../services/semanticScholar';
import { useCitationStore } from '../store/citationStore';
import { ErrorHandler } from '../utils/errorHandler';
import PapersNetwork from '../components/PapersNetwork';
import ErrorMessage from '../components/ErrorMessage';
import TopicPlottingModal from '../components/TopicPlottingModal';
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

  const {
    selectedPaper,
    firstDegreeCitations,
    setSelectedPaper,
    setFirstDegreeCitations
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

  // Combine selected paper and citations into a single papers array
  const allPapers = selectedPaper ? [selectedPaper, ...firstDegreeCitations] : firstDegreeCitations;

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

        {/* Plot Topics Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setIsTopicModalOpen(true)}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Tag className="h-4 w-4" />
            Plot Topics
          </Button>
        </div>

        <PapersNetwork
          selectedPaper={selectedPaper}
          firstDegreeCitations={firstDegreeCitations}
          onBackToTable={handleBackToTable}
        />
      </div>

      {/* Topic Plotting Modal */}
      <TopicPlottingModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        papers={allPapers}
      />
    </div>
  );
};

export default NetworkView;
