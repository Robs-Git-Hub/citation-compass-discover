
import React from 'react';
import { Paper } from '../types/semantic-scholar';

interface PaperSelectorProps {
  papers: Paper[];
  onSelect: (paper: Paper) => void;
  isVisible: boolean;
}

const PaperSelector: React.FC<PaperSelectorProps> = ({ papers, onSelect, isVisible }) => {
  if (!isVisible || papers.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-2">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
        {papers.map((paper) => (
          <button
            key={paper.paperId}
            onClick={() => onSelect(paper)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900 mb-1">
              {paper.url ? (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-[#437e84] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {paper.title}
                </a>
              ) : (
                paper.title
              )}
            </div>
            <div className="text-sm text-gray-600">
              {paper.authors?.map(author => author.name).join(', ')} • {paper.year || 'Unknown year'}
            </div>
            {paper.venue && (
              <div className="text-xs text-gray-500 mt-1">{paper.venue}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaperSelector;
