
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Brain, Edit } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import TopicEditorModal from './TopicEditorModal';

interface TopicPlottingModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: any[]; // Will be properly typed later
}

const TopicPlottingModal: React.FC<TopicPlottingModalProps> = ({
  isOpen,
  onClose,
  papers
}) => {
  const [currentView, setCurrentView] = useState<'choice' | 'manual' | 'ai'>('choice');
  const [manualTopics, setManualTopics] = useState('');
  const [aiTopics, setAiTopics] = useState<string[]>([]);
  const [isLoadingAiTopics, setIsLoadingAiTopics] = useState(false);
  const [isTopicEditorOpen, setIsTopicEditorOpen] = useState(false);

  const handleManualSubmit = () => {
    // Parse the textarea content into a list of topics
    const topicList = manualTopics
      .split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);
    
    console.log('Manual topics submitted:', topicList);
    
    // Reset and close
    setManualTopics('');
    setCurrentView('choice');
    onClose();
  };

  const handleClose = () => {
    setCurrentView('choice');
    setManualTopics('');
    setAiTopics([]);
    onClose();
  };

  const handleAITopics = async () => {
    setIsLoadingAiTopics(true);
    try {
      // TODO: Get API key from user - for now just simulate
      const apiKey = 'dummy-key'; // This will be properly implemented later
      const generatedTopics = await GeminiService.generateTopicsFromPapers(apiKey, papers);
      setAiTopics(generatedTopics);
      setIsTopicEditorOpen(true);
    } catch (error) {
      console.error('Failed to generate AI topics:', error);
      // For now, use some default topics to test the UI
      setAiTopics([
        'Machine Learning',
        'Natural Language Processing',
        'Computer Vision',
        'Data Mining',
        'Neural Networks'
      ]);
      setIsTopicEditorOpen(true);
    } finally {
      setIsLoadingAiTopics(false);
    }
  };

  const handleAiTopicsFinalized = (finalTopics: string[]) => {
    console.log('AI topics finalized:', finalTopics);
    setIsTopicEditorOpen(false);
    setCurrentView('choice');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          {currentView === 'choice' && (
            <>
              <DialogHeader>
                <DialogTitle>Plot Topics</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-600 mb-6">
                  Choose how you'd like to define topics for your papers:
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleAITopics}
                    disabled={isLoadingAiTopics}
                    className="w-full h-auto p-4 flex items-start gap-3"
                    variant="outline"
                  >
                    <Brain className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">
                        {isLoadingAiTopics ? 'Generating Topics...' : 'See AI Proposed Topics'}
                      </div>
                      <div className="text-sm text-gray-500 font-normal">
                        Let AI analyze your papers and suggest relevant topics
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setCurrentView('manual')}
                    className="w-full h-auto p-4 flex items-start gap-3"
                    variant="outline"
                  >
                    <Edit className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">Supply Topic List</div>
                      <div className="text-sm text-gray-500 font-normal">
                        Manually enter your own list of topics
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}

          {currentView === 'manual' && (
            <>
              <DialogHeader>
                <DialogTitle>Enter Topics Manually</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-2">
                    Topics (one per line)
                  </label>
                  <Textarea
                    id="topics"
                    placeholder=""
                    value={manualTopics}
                    onChange={(e) => setManualTopics(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter each topic on a separate line
                  </p>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView('choice')}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    disabled={manualTopics.trim().length === 0}
                  >
                    Use these topics
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <TopicEditorModal
        isOpen={isTopicEditorOpen}
        onClose={() => setIsTopicEditorOpen(false)}
        topics={aiTopics}
        onTopicsFinalized={handleAiTopicsFinalized}
      />
    </>
  );
};

export default TopicPlottingModal;
