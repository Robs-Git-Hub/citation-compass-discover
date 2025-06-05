
import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Drawer, DrawerContent } from './ui/drawer';
import { Citation } from '../types/semantic-scholar';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface AbstractModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Citation;
}

const AbstractModal: React.FC<AbstractModalProps> = ({
  isOpen,
  onClose,
  paper
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{paper.title}</h3>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            {paper.authors?.slice(0, 5).map(author => author.name).join(', ')}
            {paper.authors && paper.authors.length > 5 && ' et al.'}
          </div>
          
          <div>{paper.year || 'N/A'}</div>
          
          {paper.venue && (
            <div>{paper.venue}</div>
          )}
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Abstract</h4>
        <div className="text-sm text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
          {paper.abstract || 'No abstract available.'}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <div className="px-4 py-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default AbstractModal;
