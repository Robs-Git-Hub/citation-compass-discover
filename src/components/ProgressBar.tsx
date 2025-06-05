
import React from 'react';
import { Progress } from './ui/progress';
import { ProgressState } from '../types/semantic-scholar';

interface ProgressBarProps {
  progress: ProgressState;
  isVisible: boolean;
  isExpanding?: boolean;
  isFetchingAbstracts?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  isVisible, 
  isExpanding = false, 
  isFetchingAbstracts = false 
}) => {
  if (!isVisible) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const getTitle = () => {
    if (isFetchingAbstracts) {
      return 'Fetching missing abstracts';
    }
    if (isExpanding) {
      return 'Expanding to 2nd degree citations';
    }
    return 'Processing...';
  };

  const getCompletionMessage = () => {
    if (isFetchingAbstracts) {
      return '✓ Abstract fetching completed';
    }
    if (isExpanding) {
      return '✓ 2nd degree citation expansion completed';
    }
    return '✓ Processing completed';
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">
              {getTitle()}
            </span>
            <span className="text-gray-600">
              {progress.current} / {progress.total}
            </span>
          </div>
          
          <Progress value={percentage} className="w-full" />
          
          {progress.currentPaper && (
            <p className="text-xs text-gray-500 truncate">
              {isFetchingAbstracts ? 'Fetching abstract for: ' : 'Fetching citations for: '}
              {progress.currentPaper}
            </p>
          )}
          
          {progress.isComplete && (
            <p className="text-sm text-[#437e84] font-medium">
              {getCompletionMessage()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
