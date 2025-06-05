
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
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
        
        <div className="text-sm text-gray-600">
          <div>
            {paper.authors?.slice(0, 5).map(author => author.name).join(', ')}
            {paper.authors && paper.authors.length > 5 && ' et al.'}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span>{paper.year || 'N/A'}</span>
            {paper.venue && (
              <span className="text-xs text-gray-500">{paper.venue}</span>
            )}
          </div>
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
          <DrawerHeader>
            <DrawerTitle>Paper Details</DrawerTitle>
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
          <DialogTitle>Paper Details</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default AbstractModal;
