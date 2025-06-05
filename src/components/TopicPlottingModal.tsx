import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Sparkles, List, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import TopicEditorModal from './TopicEditorModal';
import { Paper } from '../types/semantic-scholar';
import { useCitationStore } from '../store/citationStore';
import { toast } from 'sonner';

interface TopicPlottingModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: Paper[];
  geminiApiKey: string | null;
}

const TopicPlottingModal: React.FC<TopicPlottingModalProps> = ({
  isOpen,
  onClose,
  papers,
  geminiApiKey
}) => {
  const [currentView, setCurrentView] = useState<'choice' | 'manual' | 'ai-editor'>('choice');
  const [manualTopics, setManualTopics] = useState('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [aiSuggestedTopics, setAiSuggestedTopics] = useState<string[]>([]);
  const [isAssigningTopics, setIsAssigningTopics] = useState(false);

  const { setTopicAssignments } = useCitationStore();

  const handleBackToChoice = () => {
    setCurrentView('choice');
    setManualTopics('');
    setAiSuggestedTopics([]);
  };

  const handleCloseModal = () => {
    onClose();
    setCurrentView('choice');
    setManualTopics('');
    setAiSuggestedTopics([]);
  };

  const handleUseManualTopics = async () => {
    if (!manualTopics.trim() || !geminiApiKey) return;

    const topicList = manualTopics
      .split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);

    await assignTopicsToAllPapers(topicList);
  };

  const handleGenerateAITopics = async () => {
    if (!geminiApiKey) return;

    setIsLoadingTopics(true);
    try {
      // Prepare papers for API call
      const papersForApi = papers.map(paper => ({
        title: paper.title,
        abstract: paper.abstract || undefined
      }));

      const generatedTopics = await GeminiService.generateTopicsFromPapers(papersForApi, geminiApiKey);
      setAiSuggestedTopics(generatedTopics);
      setCurrentView('ai-editor');
    } catch (error) {
      console.error('Failed to generate topics:', error);
      toast.error('Failed to generate topics. Please try again.');
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleAITopicsFinalized = async (finalizedTopics: string[]) => {
    await assignTopicsToAllPapers(finalizedTopics);
  };

  const assignTopicsToAllPapers = async (topics: string[]) => {
    if (!geminiApiKey) return;

    setIsAssigningTopics(true);
    try {
      // Prepare papers with IDs for the assignment API call
      const papersWithIds = papers.map(paper => ({
        id: paper.paperId,
        title: paper.title
      }));

      const assignments = await GeminiService.assignTopicsToPapers(papersWithIds, topics, geminiApiKey);
      
      // Save assignments to store instead of just logging
      setTopicAssignments(assignments);
      
      toast.success('Topics successfully assigned to papers!');
      handleCloseModal();
    } catch (error) {
      console.error('Failed to assign topics:', error);
      toast.error('Failed to assign topics. Please try again.');
    } finally {
      setIsAssigningTopics(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen && currentView !== 'ai-editor'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plot Topics</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {currentView === 'choice' && (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Choose how you'd like to categorize the papers in your network:
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleGenerateAITopics}
                    disabled={isLoadingTopics}
                    className="w-full justify-start h-auto p-4 text-left"
                    variant="outline"
                  >
                    <div className="flex items-start gap-3">
                      {isLoadingTopics ? (
                        <Loader2 className="h-5 w-5 mt-0.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">AI Proposed Topics</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Let AI analyze your papers and suggest relevant research topics
                        </div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentView('manual')}
                    className="w-full justify-start h-auto p-4 text-left"
                    variant="outline"
                  >
                    <div className="flex items-start gap-3">
                      <List className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="font-medium">Supply Topic List</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Provide your own list of topics to categorize papers
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </>
            )}

            {currentView === 'manual' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Topics</label>
                  <p className="text-xs text-gray-500">
                    Enter one topic per line. These will be used to categorize your papers.
                  </p>
                </div>
                
                <Textarea
                  placeholder="Machine Learning&#10;Natural Language Processing&#10;Computer Vision"
                  value={manualTopics}
                  onChange={(e) => setManualTopics(e.target.value)}
                  className="min-h-[120px]"
                />
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleBackToChoice}>
                    Back
                  </Button>
                  <Button
                    onClick={handleUseManualTopics}
                    disabled={!manualTopics.trim() || isAssigningTopics}
                  >
                    {isAssigningTopics && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Use these topics
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Topic Editor Modal for AI flow */}
      <TopicEditorModal
        isOpen={currentView === 'ai-editor'}
        onClose={handleBackToChoice}
        topics={aiSuggestedTopics}
        onTopicsFinalized={handleAITopicsFinalized}
      />
    </>
  );
};

export default TopicPlottingModal;
