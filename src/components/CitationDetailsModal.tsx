
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Citation } from '../types/semantic-scholar';
import { ExternalLink } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface CitationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  paperTitle: string;
}

const CitationDetailsModal: React.FC<CitationDetailsModalProps> = ({
  isOpen,
  onClose,
  citations,
  paperTitle
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const content = (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Papers citing: <span className="font-medium">{paperTitle}</span>
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-3">
        {citations.map((citation) => (
          <div key={citation.paperId} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {citation.url ? (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#437e84] hover:text-[#2d5a5f] hover:underline"
                >
                  {citation.title || 'Untitled'}
                </a>
              ) : (
                citation.title || 'Untitled'
              )}
            </h4>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                {citation.authors?.slice(0, 3).map(author => author.name).join(', ')}
                {citation.authors && citation.authors.length > 3 && ' et al.'}
              </div>
              
              <div className="flex items-center justify-between">
                <span>{citation.year || 'N/A'}</span>
                {citation.citationCount && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {citation.citationCount} citations
                  </span>
                )}
              </div>
              
              {citation.venue && (
                <div className="text-xs text-gray-500">{citation.venue}</div>
              )}
              
              {citation.url && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[#437e84] hover:text-[#2d5a5f] text-xs"
                >
                  View paper <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Citations ({citations.length})</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Citations ({citations.length})</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CitationDetailsModal;
