
import React from 'react';
import { Progress } from './ui/progress';
import { ProgressState } from '../types/semantic-scholar';

interface ProgressBarProps {
  progress: ProgressState;
  isVisible: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isVisible }) => {
  if (!isVisible) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">
              Expanding to 2nd degree citations
            </span>
            <span className="text-gray-600">
              {progress.current} / {progress.total}
            </span>
          </div>
          
          <Progress value={percentage} className="w-full" />
          
          {progress.currentPaper && (
            <p className="text-xs text-gray-500 truncate">
              Fetching citations for: {progress.currentPaper}
            </p>
          )}
          
          {progress.isComplete && (
            <p className="text-sm text-[#437e84] font-medium">
              ✓ 2nd degree citation expansion completed
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
